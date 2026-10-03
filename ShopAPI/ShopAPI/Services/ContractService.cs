using ShopAPI.Data;
using ShopAPI.DTOs;
using ShopAPI.Interfaces;
using ShopAPI.Models;

namespace ShopAPI.Services
{
    public class ContractService : IContractService
    {
        private readonly IContractRepository _contractRepository;
        private readonly IRoomRepository _roomRepository;
        private readonly ITenantService _tenantService;
        private readonly IInvoiceService _invoiceService;
        private readonly INotificationService _notificationService;
        private readonly IActivityLogService _activityLogService;
        private readonly AppDbContext _context;

        public ContractService(
            IContractRepository contractRepository,
            IRoomRepository roomRepository,
            ITenantService tenantService,
            IInvoiceService invoiceService,
            INotificationService notificationService,
            IActivityLogService activityLogService,
            AppDbContext context)
        {
            _contractRepository = contractRepository;
            _roomRepository = roomRepository;
            _tenantService = tenantService;
            _invoiceService = invoiceService;
            _notificationService = notificationService;
            _activityLogService = activityLogService;
            _context = context;
        }

        public List<ContractDto> GetAll(string? status)
        {
            var contracts = _contractRepository.GetAll().AsQueryable();

            if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<ContractStatus>(status, out var contractStatus))
            {
                contracts = contracts.Where(c => c.Status == contractStatus);
            }

            return contracts.Select(MapToDto).ToList();
        }

        public List<ContractDto> GetMy(int userId)
        {
            var tenant = _tenantService.GetByUserId(userId);

            if (tenant == null)
            {
                return new List<ContractDto>();
            }

            return _contractRepository.GetByTenantId(tenant.Id).Select(MapToDto).ToList();
        }

        public ContractDto? GetById(int id)
        {
            var contract = _contractRepository.GetById(id);

            return contract == null ? null : MapToDto(contract);
        }

        public bool IsOwnedByUser(int contractId, int userId)
        {
            var contract = _contractRepository.GetById(contractId);

            return contract?.Tenant?.UserId == userId;
        }

        public ContractDto? Request(int userId, RequestContractDto dto)
        {
            var room = _roomRepository.GetById(dto.RoomId);

            if (room == null || room.Status != RoomStatus.Trong)
            {
                return null;
            }

            var tenant = _tenantService.UpsertForUser(userId, dto.TenantProfile);

            var contract = new Contract
            {
                RoomId = dto.RoomId,
                TenantId = tenant.Id,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                MonthlyRent = room.Price,
                Deposit = 0,
                NumberOfOccupants = dto.NumberOfOccupants > 0 ? dto.NumberOfOccupants : 1,
                Status = ContractStatus.ChoDuyet,
                CreatedAt = DateTime.UtcNow
            };

            _contractRepository.Add(contract);

            _notificationService.NotifyRole(
                "Admin",
                "YĂªu cáº§u thuĂª phĂ²ng má»›i",
                $"KhĂ¡ch thuĂª {tenant.FullName} vá»«a Ä‘Äƒng kĂ½ thuĂª phĂ²ng {room.RoomNumber}. VĂ o má»¥c Há»£p Ä‘á»“ng Ä‘á»ƒ duyá»‡t.",
                "HopDong");

            _activityLogService.Log(userId, "RequestContract", "Contract", contract.Id, $"ÄÄƒng kĂ½ thuĂª phĂ²ng {room.RoomNumber}");

            return GetById(contract.Id);
        }

        public bool Approve(int contractId, ApproveContractDto dto, int approverUserId)
        {
            var contract = _contractRepository.GetById(contractId);

            if (contract == null || contract.Status != ContractStatus.ChoDuyet)
            {
                return false;
            }

            using var transaction = _context.Database.BeginTransaction();
            try
            {
                contract.Deposit = dto.Deposit;
                contract.MonthlyRent = dto.MonthlyRent;
                contract.NumberOfOccupants = dto.NumberOfOccupants > 0 ? dto.NumberOfOccupants : contract.NumberOfOccupants;
                contract.ElectricUnitPrice = dto.ElectricUnitPrice;
                contract.WaterUnitPrice = dto.WaterUnitPrice;

                if (dto.EndDate.HasValue)
                {
                    contract.EndDate = dto.EndDate.Value;
                }

                contract.Status = ContractStatus.ChoCoc;

                _contractRepository.Update(contract);

                _invoiceService.CreateDepositInvoice(contract.Id, contract.StartDate, dto.Deposit);

                _activityLogService.Log(approverUserId, "ApproveContract", "Contract", contract.Id, $"Deposit={dto.Deposit}, MonthlyRent={dto.MonthlyRent}");

                transaction.Commit();
                return true;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        public bool Reject(int contractId, RejectContractDto dto, int approverUserId)
        {
            var contract = _contractRepository.GetById(contractId);

            if (contract == null || contract.Status != ContractStatus.ChoDuyet)
            {
                return false;
            }

            contract.Status = ContractStatus.TuChoi;

            _contractRepository.Update(contract);

            _activityLogService.Log(approverUserId, "RejectContract", "Contract", contract.Id, dto.Reason);

            return true;
        }

        public bool Terminate(int contractId, int actorUserId)
        {
            var contract = _contractRepository.GetById(contractId);

            if (contract == null || contract.Status != ContractStatus.DangHieuLuc)
            {
                return false;
            }

            contract.Status = ContractStatus.DaKetThuc;
            _contractRepository.Update(contract);

            var room = _roomRepository.GetById(contract.RoomId);

            if (room != null)
            {
                room.Status = RoomStatus.Trong;
                _roomRepository.Update(room);
            }

            _activityLogService.Log(actorUserId, "TerminateContract", "Contract", contract.Id, null);

            return true;
        }

        public (bool Success, string? Error) SetUnitPrice(int contractId, SetContractUnitPriceDto dto, int actorUserId)
        {
            var contract = _contractRepository.GetById(contractId);

            if (contract == null || contract.Status != ContractStatus.DangHieuLuc)
            {
                return (false, "Há»£p Ä‘á»“ng khĂ´ng tá»“n táº¡i hoáº·c chÆ°a cĂ³ hiá»‡u lá»±c.");
            }

            contract.ElectricUnitPrice = dto.ElectricUnitPrice;
            contract.WaterUnitPrice = dto.WaterUnitPrice;

            _contractRepository.Update(contract);

            if (contract.Tenant != null)
            {
                _notificationService.Create(new CreateNotificationDto
                {
                    UserId = contract.Tenant.UserId,
                    Title = "Cáº­p nháº­t Ä‘Æ¡n giĂ¡ Ä‘iá»‡n/nÆ°á»›c",
                    Content = $"ÄÆ¡n giĂ¡ Ä‘iá»‡n/nÆ°á»›c Ă¡p dá»¥ng cho phĂ²ng {contract.Room?.RoomNumber} tá»« bĂ¢y giá»: {dto.ElectricUnitPrice:N0}Ä‘/kWh, {dto.WaterUnitPrice:N0}Ä‘/mÂ³.",
                    Type = "HopDong"
                }, actorUserId);
            }

            _activityLogService.Log(actorUserId, "SetContractUnitPrice", "Contract", contractId, $"ElectricUnitPrice={dto.ElectricUnitPrice}, WaterUnitPrice={dto.WaterUnitPrice}");

            return (true, null);
        }

        public List<OccupantDto>? GetOccupants(int contractId)
        {
            var contract = _contractRepository.GetById(contractId);

            return contract == null ? null : contract.Occupants.Select(MapOccupantToDto).ToList();
        }

        public (List<OccupantDto>? Occupants, string? Error) AddOccupant(int contractId, CreateOccupantDto dto, int actorUserId)
        {
            var contract = _contractRepository.GetById(contractId);

            if (contract == null || contract.Status != ContractStatus.DangHieuLuc)
            {
                return (null, "Há»£p Ä‘á»“ng khĂ´ng tá»“n táº¡i hoáº·c chÆ°a cĂ³ hiá»‡u lá»±c.");
            }

            // NumberOfOccupants tĂ­nh cáº£ ngÆ°á»i thuĂª chĂ­nh, nĂªn chá»‰ khai bĂ¡o thĂªm Ä‘Æ°á»£c tá»‘i Ä‘a NumberOfOccupants - 1 ngÆ°á»i.
            if (contract.Occupants.Count >= contract.NumberOfOccupants - 1)
            {
                return (null, "ÄĂ£ khai bĂ¡o Ä‘á»§ sá»‘ ngÆ°á»i á»Ÿ theo há»£p Ä‘á»“ng (NumberOfOccupants). Náº¿u cáº§n thĂªm ngÆ°á»i, hĂ£y sá»­a láº¡i sá»‘ ngÆ°á»i á»Ÿ trong há»£p Ä‘á»“ng trÆ°á»›c.");
            }

            _contractRepository.AddOccupant(new Occupant
            {
                ContractId = contractId,
                FullName = dto.FullName,
                Relationship = dto.Relationship,
                IdCardNumber = dto.IdCardNumber,
                Phone = dto.Phone,
                CreatedAt = DateTime.UtcNow
            });

            _activityLogService.Log(actorUserId, "AddOccupant", "Contract", contractId, $"ThĂªm ngÆ°á»i á»Ÿ cĂ¹ng: {dto.FullName} ({dto.Relationship})");

            var occupants = _contractRepository.GetById(contractId)!.Occupants.Select(MapOccupantToDto).ToList();

            return (occupants, null);
        }

        public bool IsOccupantOwnedByUser(int occupantId, int userId)
        {
            var occupant = _contractRepository.GetOccupantById(occupantId);

            if (occupant == null)
            {
                return false;
            }

            var contract = _contractRepository.GetById(occupant.ContractId);

            return contract?.Tenant?.UserId == userId;
        }

        public (OccupantDto? Occupant, string? Error) UpdateOccupant(int occupantId, UpdateOccupantDto dto, int actorUserId)
        {
            var occupant = _contractRepository.GetOccupantById(occupantId);

            if (occupant == null)
            {
                return (null, "KhĂ´ng tĂ¬m tháº¥y ngÆ°á»i á»Ÿ cĂ¹ng.");
            }

            occupant.FullName = dto.FullName;
            occupant.Relationship = dto.Relationship;
            occupant.IdCardNumber = dto.IdCardNumber;
            occupant.Phone = dto.Phone;

            _contractRepository.UpdateOccupant(occupant);

            _activityLogService.Log(actorUserId, "UpdateOccupant", "Contract", occupant.ContractId, $"Sá»­a ngÆ°á»i á»Ÿ cĂ¹ng #{occupant.Id}: {dto.FullName} ({dto.Relationship})");

            return (MapOccupantToDto(occupant), null);
        }

        public bool RemoveOccupant(int occupantId, int actorUserId)
        {
            var occupant = _contractRepository.GetOccupantById(occupantId);

            if (occupant == null)
            {
                return false;
            }

            var contractId = occupant.ContractId;

            _contractRepository.RemoveOccupant(occupant);

            _activityLogService.Log(actorUserId, "RemoveOccupant", "Contract", contractId, $"XĂ³a ngÆ°á»i á»Ÿ cĂ¹ng: {occupant.FullName}");

            return true;
        }

        private static OccupantDto MapOccupantToDto(Occupant occupant)
        {
            return new OccupantDto
            {
                Id = occupant.Id,
                ContractId = occupant.ContractId,
                FullName = occupant.FullName,
                Relationship = occupant.Relationship,
                IdCardNumber = occupant.IdCardNumber,
                Phone = occupant.Phone,
                CreatedAt = occupant.CreatedAt
            };
        }

        private static ContractDto MapToDto(Contract contract)
        {
            return new ContractDto
            {
                Id = contract.Id,
                RoomId = contract.RoomId,
                RoomNumber = contract.Room?.RoomNumber,
                TenantId = contract.TenantId,
                TenantName = contract.Tenant?.FullName,
                StartDate = contract.StartDate,
                EndDate = contract.EndDate,
                Deposit = contract.Deposit,
                MonthlyRent = contract.MonthlyRent,
                NumberOfOccupants = contract.NumberOfOccupants,
                ElectricUnitPrice = contract.ElectricUnitPrice,
                WaterUnitPrice = contract.WaterUnitPrice,
                Status = contract.Status.ToString(),
                CreatedAt = contract.CreatedAt,
                Occupants = contract.Occupants.Select(MapOccupantToDto).ToList()
            };
        }
    }
}
