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

        public ContractService(
            IContractRepository contractRepository,
            IRoomRepository roomRepository,
            ITenantService tenantService,
            IInvoiceService invoiceService,
            INotificationService notificationService,
            IActivityLogService activityLogService)
        {
            _contractRepository = contractRepository;
            _roomRepository = roomRepository;
            _tenantService = tenantService;
            _invoiceService = invoiceService;
            _notificationService = notificationService;
            _activityLogService = activityLogService;
        }

        public List<ContractDto> GetAll(string? status)
        {
            var contracts = _contractRepository.GetAll().AsQueryable();

            if (!string.IsNullOrWhiteSpace(status))
            {
                contracts = contracts.Where(c => c.Status == status);
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

            if (room == null || room.Status != "Trong")
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
                Status = "ChoDuyet",
                CreatedAt = DateTime.Now
            };

            _contractRepository.Add(contract);

            _notificationService.NotifyRole(
                "Admin",
                "Yêu cầu thuê phòng mới",
                $"Khách thuê {tenant.FullName} vừa đăng ký thuê phòng {room.RoomNumber}. Vào mục Hợp đồng để duyệt.",
                "HopDong");

            _activityLogService.Log(userId, "RequestContract", "Contract", contract.Id, $"Đăng ký thuê phòng {room.RoomNumber}");

            return GetById(contract.Id);
        }

        public bool Approve(int contractId, ApproveContractDto dto, int approverUserId)
        {
            var contract = _contractRepository.GetById(contractId);

            if (contract == null || contract.Status != "ChoDuyet")
            {
                return false;
            }

            contract.Deposit = dto.Deposit;
            contract.MonthlyRent = dto.MonthlyRent;
            contract.NumberOfOccupants = dto.NumberOfOccupants > 0 ? dto.NumberOfOccupants : contract.NumberOfOccupants;
            contract.ElectricUnitPrice = dto.ElectricUnitPrice;
            contract.WaterUnitPrice = dto.WaterUnitPrice;

            if (dto.EndDate.HasValue)
            {
                contract.EndDate = dto.EndDate.Value;
            }

            contract.Status = "ChoCoc";

            _contractRepository.Update(contract);

            _invoiceService.CreateDepositInvoice(contract.Id, contract.StartDate, dto.Deposit);

            _activityLogService.Log(approverUserId, "ApproveContract", "Contract", contract.Id, $"Deposit={dto.Deposit}, MonthlyRent={dto.MonthlyRent}");

            return true;
        }

        public bool Reject(int contractId, RejectContractDto dto, int approverUserId)
        {
            var contract = _contractRepository.GetById(contractId);

            if (contract == null || contract.Status != "ChoDuyet")
            {
                return false;
            }

            contract.Status = "TuChoi";

            _contractRepository.Update(contract);

            _activityLogService.Log(approverUserId, "RejectContract", "Contract", contract.Id, dto.Reason);

            return true;
        }

        public bool Terminate(int contractId, int actorUserId)
        {
            var contract = _contractRepository.GetById(contractId);

            if (contract == null || contract.Status != "DangHieuLuc")
            {
                return false;
            }

            contract.Status = "DaKetThuc";
            _contractRepository.Update(contract);

            var room = _roomRepository.GetById(contract.RoomId);

            if (room != null)
            {
                room.Status = "Trong";
                _roomRepository.Update(room);
            }

            _activityLogService.Log(actorUserId, "TerminateContract", "Contract", contract.Id, null);

            return true;
        }

        public (bool Success, string? Error) SetUnitPrice(int contractId, SetContractUnitPriceDto dto, int actorUserId)
        {
            var contract = _contractRepository.GetById(contractId);

            if (contract == null || contract.Status != "DangHieuLuc")
            {
                return (false, "Hợp đồng không tồn tại hoặc chưa có hiệu lực.");
            }

            contract.ElectricUnitPrice = dto.ElectricUnitPrice;
            contract.WaterUnitPrice = dto.WaterUnitPrice;

            _contractRepository.Update(contract);

            if (contract.Tenant != null)
            {
                _notificationService.Create(new CreateNotificationDto
                {
                    UserId = contract.Tenant.UserId,
                    Title = "Cập nhật đơn giá điện/nước",
                    Content = $"Đơn giá điện/nước áp dụng cho phòng {contract.Room?.RoomNumber} từ bây giờ: {dto.ElectricUnitPrice:N0}đ/kWh, {dto.WaterUnitPrice:N0}đ/m³.",
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

            if (contract == null || contract.Status != "DangHieuLuc")
            {
                return (null, "Hợp đồng không tồn tại hoặc chưa có hiệu lực.");
            }

            // NumberOfOccupants tính cả người thuê chính, nên chỉ khai báo thêm được tối đa NumberOfOccupants - 1 người.
            if (contract.Occupants.Count >= contract.NumberOfOccupants - 1)
            {
                return (null, "Đã khai báo đủ số người ở theo hợp đồng (NumberOfOccupants). Nếu cần thêm người, hãy sửa lại số người ở trong hợp đồng trước.");
            }

            _contractRepository.AddOccupant(new Occupant
            {
                ContractId = contractId,
                FullName = dto.FullName,
                Relationship = dto.Relationship,
                IdCardNumber = dto.IdCardNumber,
                Phone = dto.Phone,
                CreatedAt = DateTime.Now
            });

            _activityLogService.Log(actorUserId, "AddOccupant", "Contract", contractId, $"Thêm người ở cùng: {dto.FullName} ({dto.Relationship})");

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
                return (null, "Không tìm thấy người ở cùng.");
            }

            occupant.FullName = dto.FullName;
            occupant.Relationship = dto.Relationship;
            occupant.IdCardNumber = dto.IdCardNumber;
            occupant.Phone = dto.Phone;

            _contractRepository.UpdateOccupant(occupant);

            _activityLogService.Log(actorUserId, "UpdateOccupant", "Contract", occupant.ContractId, $"Sửa người ở cùng #{occupant.Id}: {dto.FullName} ({dto.Relationship})");

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

            _activityLogService.Log(actorUserId, "RemoveOccupant", "Contract", contractId, $"Xóa người ở cùng: {occupant.FullName}");

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
                Status = contract.Status,
                CreatedAt = contract.CreatedAt,
                Occupants = contract.Occupants.Select(MapOccupantToDto).ToList()
            };
        }
    }
}
