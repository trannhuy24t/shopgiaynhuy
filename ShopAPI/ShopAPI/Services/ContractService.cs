using ShopAPI.Data;
using ShopAPI.DTOs;
using ShopAPI.Interfaces;
using ShopAPI.Models;
using System.Security.Cryptography;
using System.Text;

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
        private readonly IStorageService _storageService;
        private readonly AppDbContext _context;

        public ContractService(
            IContractRepository contractRepository,
            IRoomRepository roomRepository,
            ITenantService tenantService,
            IInvoiceService invoiceService,
            INotificationService notificationService,
            IActivityLogService activityLogService,
            IStorageService storageService,
            AppDbContext context)
        {
            _contractRepository = contractRepository;
            _roomRepository = roomRepository;
            _tenantService = tenantService;
            _invoiceService = invoiceService;
            _notificationService = notificationService;
            _activityLogService = activityLogService;
            _storageService = storageService;
            _context = context;
        }

        private static string ComputeSignatureHash(string payload)
        {
            using var sha = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(payload);
            var hashBytes = sha.ComputeHash(bytes);
            return Convert.ToHexString(hashBytes);
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

            var totalOccupants = dto.NumberOfOccupants > 0 ? dto.NumberOfOccupants : 1;
            var validOccupants = dto.Occupants?.Where(o => !string.IsNullOrWhiteSpace(o.FullName)).ToList();
            if (validOccupants != null && validOccupants.Count > 0 && validOccupants.Count + 1 > totalOccupants)
            {
                totalOccupants = validOccupants.Count + 1;
            }

            var contract = new Contract
            {
                RoomId = dto.RoomId,
                TenantId = tenant.Id,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                MonthlyRent = room.Price,
                Deposit = 0,
                NumberOfOccupants = totalOccupants,
                Status = ContractStatus.ChoDuyet,
                CreatedAt = DateTime.UtcNow
            };

            // Lưu chữ ký số của khách thuê nếu có
            if (!string.IsNullOrWhiteSpace(dto.TenantSignature))
            {
                contract.SignedAt = DateTime.UtcNow;
                var rawPayload = $"TENANT:{tenant.FullName}|CCCD:{tenant.IdCardNumber}|ROOM:{room.RoomNumber}|TIME:{contract.SignedAt:O}";
                contract.SignatureHash = ComputeSignatureHash(rawPayload);

                try
                {
                    if (dto.TenantSignature.StartsWith("data:image/") || dto.TenantSignature.Length > 200)
                    {
                        var task = _storageService.UploadBase64ImageAsync(dto.TenantSignature, "signatures", $"sig_r{dto.RoomId}");
                        contract.TenantSignatureUrl = task.GetAwaiter().GetResult();
                    }
                    else
                    {
                        contract.TenantSignatureUrl = dto.TenantSignature;
                    }
                }
                catch
                {
                    // Fallback nếu MinIO chưa khả dụng
                    contract.TenantSignatureUrl = dto.TenantSignature;
                }
            }

            _contractRepository.Add(contract);

            if (validOccupants != null && validOccupants.Count > 0)
            {
                foreach (var occ in validOccupants)
                {
                    _contractRepository.AddOccupant(new Occupant
                    {
                        ContractId = contract.Id,
                        FullName = occ.FullName.Trim(),
                        Relationship = string.IsNullOrWhiteSpace(occ.Relationship) ? "Người ở cùng" : occ.Relationship.Trim(),
                        IdCardNumber = string.IsNullOrWhiteSpace(occ.IdCardNumber) ? null : occ.IdCardNumber.Trim(),
                        Phone = string.IsNullOrWhiteSpace(occ.Phone) ? null : occ.Phone.Trim(),
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            _notificationService.NotifyRole(
                "Admin",
                "Yêu cầu thuê phòng mới",
                $"Khách thuê {tenant.FullName} vừa đăng ký thuê phòng {room.RoomNumber}. Vào mục Hợp đồng để duyệt.",
                "HopDong");

            _activityLogService.Log(userId, "RequestContract", "Contract", contract.Id, $"Đăng ký thuê phòng {room.RoomNumber}");

            return GetById(contract.Id);
        }

        public ContractDto? SignContract(int contractId, string signatureBase64, int userId)
        {
            var contract = _contractRepository.GetById(contractId);
            if (contract == null || contract.Tenant?.UserId != userId)
            {
                return null;
            }

            contract.SignedAt = DateTime.UtcNow;
            var tenantName = contract.Tenant?.FullName ?? "Tenant";
            var idCard = contract.Tenant?.IdCardNumber ?? "";
            var roomNumber = contract.Room?.RoomNumber ?? "";
            var rawPayload = $"TENANT:{tenantName}|CCCD:{idCard}|ROOM:{roomNumber}|TIME:{contract.SignedAt:O}";
            contract.SignatureHash = ComputeSignatureHash(rawPayload);

            try
            {
                if (signatureBase64.StartsWith("data:image/") || signatureBase64.Length > 200)
                {
                    var task = _storageService.UploadBase64ImageAsync(signatureBase64, "signatures", $"sig_c{contract.Id}");
                    contract.TenantSignatureUrl = task.GetAwaiter().GetResult();
                }
                else
                {
                    contract.TenantSignatureUrl = signatureBase64;
                }
            }
            catch
            {
                contract.TenantSignatureUrl = signatureBase64;
            }

            _contractRepository.Update(contract);
            _activityLogService.Log(userId, "SignContract", "Contract", contract.Id, $"Khách thuê ký số hợp đồng phòng {roomNumber}");

            return GetById(contract.Id);
        }

        public bool CancelRequest(int contractId, int userId)
        {
            var contract = _contractRepository.GetById(contractId);
            if (contract == null || contract.Tenant?.UserId != userId || contract.Status != ContractStatus.ChoDuyet)
            {
                return false;
            }

            contract.Status = ContractStatus.DaHuy;
            _contractRepository.Update(contract);
            _notificationService.NotifyRole("Admin", "Khách thuê đã hủy yêu cầu", $"Yêu cầu thuê phòng #{contract.Id} đã được khách thuê hủy.", "HopDong", relatedContractId: contract.Id);
            return true;
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
                contract.LandlordSignedAt = DateTime.UtcNow;

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

        public bool Extend(int contractId, ExtendContractDto dto, int actorUserId)
        {
            var contract = _contractRepository.GetById(contractId);
            if (contract == null || contract.Status != ContractStatus.DangHieuLuc || dto.EndDate <= contract.EndDate)
            {
                return false;
            }

            contract.EndDate = dto.EndDate;
            _contractRepository.Update(contract);
            if (contract.Tenant?.UserId is int tenantUserId)
            {
                _notificationService.Create(new CreateNotificationDto
                {
                    UserId = tenantUserId,
                    Title = "Hợp đồng đã được gia hạn",
                    Content = $"Thời hạn hợp đồng #{contract.Id} được cập nhật đến {contract.EndDate:dd/MM/yyyy}.",
                    Type = "HopDong",
                    RelatedContractId = contract.Id
                }, actorUserId);
            }
            _activityLogService.Log(actorUserId, "ExtendContract", "Contract", contract.Id, $"EndDate={contract.EndDate:O}");
            return true;
        }

        public (bool Success, string? Error) SetUnitPrice(int contractId, SetContractUnitPriceDto dto, int actorUserId)
        {
            var contract = _contractRepository.GetById(contractId);

            if (contract == null || contract.Status != ContractStatus.DangHieuLuc)
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

            if (contract == null || contract.Status != ContractStatus.DangHieuLuc)
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
                CreatedAt = DateTime.UtcNow
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
            var landlord = contract.Room?.Building?.Owner;
            var tenant = contract.Tenant;

            return new ContractDto
            {
                Id = contract.Id,
                RoomId = contract.RoomId,
                RoomNumber = contract.Room?.RoomNumber,
                RoomPrice = contract.Room?.Price ?? contract.MonthlyRent,
                RoomArea = contract.Room?.Area ?? 0,
                RoomServiceFee = contract.Room?.ServiceFee ?? 0,
                BuildingName = contract.Room?.Building?.Name,
                BuildingAddress = contract.Room?.Building?.Address,
                LandlordName = !string.IsNullOrWhiteSpace(landlord?.FullName) ? landlord.FullName : "Ban Quản lý Tòa nhà TroHub",
                LandlordPhone = !string.IsNullOrWhiteSpace(landlord?.PhoneNumber) ? landlord.PhoneNumber : "0900.000.000",
                RoomImageUrl = contract.Room?.ImageUrl,
                Image = contract.Room?.ImageUrl ?? contract.Room?.Media?.FirstOrDefault(m => m.Type == "Image")?.Url,
                RoomImages = contract.Room?.Media?.Where(m => m.Type == "Image").OrderBy(m => m.SortOrder).Select(m => m.Url).ToList() ?? new(),

                TenantId = contract.TenantId,
                TenantName = tenant?.FullName ?? tenant?.User?.FullName,
                TenantPhone = tenant?.Phone ?? tenant?.User?.PhoneNumber,
                TenantIdCard = tenant?.IdCardNumber,
                TenantEmail = tenant?.Email ?? tenant?.User?.Email,

                StartDate = contract.StartDate,
                EndDate = contract.EndDate,
                Deposit = contract.Deposit,
                MonthlyRent = contract.MonthlyRent,
                NumberOfOccupants = contract.NumberOfOccupants,
                ElectricUnitPrice = contract.ElectricUnitPrice,
                WaterUnitPrice = contract.WaterUnitPrice,
                Status = contract.Status.ToString(),
                CreatedAt = contract.CreatedAt,
                Occupants = contract.Occupants.Select(MapOccupantToDto).ToList(),

                TenantSignatureUrl = contract.TenantSignatureUrl,
                SignedAt = contract.SignedAt,
                SignatureHash = contract.SignatureHash,
                LandlordSignatureUrl = contract.LandlordSignatureUrl,
                LandlordSignedAt = contract.LandlordSignedAt
            };
        }
    }
}
