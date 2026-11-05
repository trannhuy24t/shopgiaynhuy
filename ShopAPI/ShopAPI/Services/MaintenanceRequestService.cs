using ShopAPI.DTOs;
using ShopAPI.Interfaces;
using ShopAPI.Models;

namespace ShopAPI.Services
{
    public class MaintenanceRequestService : IMaintenanceRequestService
    {
        private readonly IMaintenanceRequestRepository _requestRepository;
        private readonly IContractRepository _contractRepository;
        private readonly ITenantService _tenantService;
        private readonly INotificationService _notificationService;
        private readonly IActivityLogService _activityLogService;
        private readonly ILogger<MaintenanceRequestService> _logger;

        public MaintenanceRequestService(
            IMaintenanceRequestRepository requestRepository,
            IContractRepository contractRepository,
            ITenantService tenantService,
            INotificationService notificationService,
            IActivityLogService activityLogService,
            ILogger<MaintenanceRequestService> logger)
        {
            _requestRepository = requestRepository;
            _contractRepository = contractRepository;
            _tenantService = tenantService;
            _notificationService = notificationService;
            _activityLogService = activityLogService;
            _logger = logger;
        }

        public List<MaintenanceRequestDto> GetAll(string? status)
        {
            var requests = _requestRepository.GetAll().AsQueryable();

            if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<MaintenanceStatus>(status, out var maintenanceStatus))
            {
                requests = requests.Where(r => r.Status == maintenanceStatus);
            }

            return requests.Select(MapToDto).ToList();
        }

        public List<MaintenanceRequestDto> GetMy(int userId)
        {
            var tenant = _tenantService.GetByUserId(userId);

            if (tenant == null)
            {
                return new List<MaintenanceRequestDto>();
            }

            return _requestRepository.GetByTenantId(tenant.Id).Select(MapToDto).ToList();
        }

        public MaintenanceRequestDto? GetById(int id)
        {
            var request = _requestRepository.GetById(id);

            return request == null ? null : MapToDto(request);
        }

        public bool IsOwnedByUser(int requestId, int userId)
        {
            var request = _requestRepository.GetById(requestId);

            return request?.Tenant?.UserId == userId;
        }

        public MaintenanceRequestDto? Create(int userId, CreateMaintenanceRequestDto dto)
        {
            var tenant = _tenantService.GetByUserId(userId);

            if (tenant == null)
            {
                return null;
            }

            var hasActiveContract = _contractRepository.GetByTenantId(tenant.Id)
                .Any(c => c.RoomId == dto.RoomId && c.Status == ContractStatus.DangHieuLuc);

            if (!hasActiveContract)
            {
                return null;
            }

            Enum.TryParse<MaintenancePriority>(dto.Priority, out var priority);

            var request = new MaintenanceRequest
            {
                RoomId = dto.RoomId,
                TenantId = tenant.Id,
                Title = dto.Title,
                Description = dto.Description,
                ImageUrl = dto.ImageUrl,
                Priority = priority,
                Status = MaintenanceStatus.Moi,
                CreatedAt = DateTime.UtcNow
            };

            _requestRepository.Add(request);

            var result = GetById(request.Id);

            var content = $"Khách thuê {tenant.FullName} báo sự cố tại phòng {result?.RoomNumber}: {dto.Title}";
            _notificationService.NotifyRole("Admin", "Yêu cầu bảo trì mới", content, "BaoTri");
            _notificationService.NotifyRole("Staff", "Yêu cầu bảo trì mới", content, "BaoTri");

            _activityLogService.Log(userId, "CreateMaintenanceRequest", "MaintenanceRequest", request.Id, dto.Title);

            return result;
        }

        public bool Assign(int id, AssignMaintenanceDto dto, int actorUserId)
        {
            var request = _requestRepository.GetById(id);

            if (request == null || request.Status is not (MaintenanceStatus.Moi or MaintenanceStatus.DaPhanCong))
            {
                return false;
            }

            request.AssignedToUserId = dto.AssignedToUserId;
            request.Status = MaintenanceStatus.DaPhanCong;

            _requestRepository.Update(request);

            _activityLogService.Log(actorUserId, "AssignMaintenanceRequest", "MaintenanceRequest", request.Id, $"AssignedToUserId={dto.AssignedToUserId}");

            var updated = GetById(request.Id);

            var staffName = updated?.AssignedToUserName ?? "Kỹ thuật viên";
            var tenantName = updated?.TenantName ?? "Khách thuê";
            var roomNumber = updated?.RoomNumber ?? request.RoomId.ToString();
            var buildingName = !string.IsNullOrWhiteSpace(updated?.BuildingName) ? $" ({updated.BuildingName})" : "";
            var priorityName = request.Priority switch
            {
                MaintenancePriority.Cao => "Cao (Khẩn cấp)",
                MaintenancePriority.TrungBinh => "Trung bình",
                MaintenancePriority.Thap => "Thấp (Bình thường)",
                _ => request.Priority.ToString()
            };

            // 1. Tự động tạo thông báo trên Web & Push & Telegram cho nhân viên được phân công
            _notificationService.Create(new CreateNotificationDto
            {
                UserId = dto.AssignedToUserId,
                Title = "Phân công xử lý sự cố",
                Content = $"Kỹ thuật viên {staffName} được phân công tiếp nhận sự cố #{request.Id} tại phòng {roomNumber}{buildingName} của khách thuê {tenantName}. Nội dung sự cố: {request.Title} (Mức ưu tiên: {priorityName}).",
                Type = "BaoTri"
            }, actorUserId);

            return true;
        }

        public bool UpdateStatus(int id, UpdateMaintenanceStatusDto dto, int actorUserId)
        {
            var request = _requestRepository.GetById(id);

            if (request == null)
            {
                return false;
            }

            if (!Enum.TryParse<MaintenanceStatus>(dto.Status, out var newStatus))
            {
                return false;
            }

            request.Status = newStatus;
            if (!string.IsNullOrWhiteSpace(dto.Note))
            {
                request.Note = AppendConversation(request.Note, "Quản lý", dto.Note.Trim());
            }

            if (newStatus is MaintenanceStatus.HoanThanh or MaintenanceStatus.DaHuy)
            {
                request.ResolvedAt = DateTime.UtcNow;
            }

            _requestRepository.Update(request);

            _activityLogService.Log(actorUserId, "UpdateMaintenanceStatus", "MaintenanceRequest", request.Id, dto.Status);

            // Tự động tạo thông báo trên Web & Push & Telegram cho khách thuê
            var tenantUserId = request.Tenant?.UserId;
            if (tenantUserId == null && request.TenantId > 0)
            {
                tenantUserId = _tenantService.GetById(request.TenantId)?.UserId;
            }

            if (tenantUserId != null)
            {
                var tenantName = request.Tenant?.FullName;
                if (string.IsNullOrEmpty(tenantName) && request.TenantId > 0)
                {
                    tenantName = _tenantService.GetById(request.TenantId)?.FullName;
                }
                tenantName ??= "Khách thuê";

                var roomStr = request.Room?.RoomNumber ?? request.RoomId.ToString();
                var noteDetail = !string.IsNullOrWhiteSpace(dto.Note) ? $" Ghi chú: {dto.Note.Trim()}" : "";
                var statusText = dto.Status switch
                {
                    "DangXuLy" => "Đang xử lý",
                    "HoanThanh" => "Đã hoàn thành",
                    "DaHuy" => "Đã hủy",
                    _ => dto.Status
                };

                _notificationService.Create(new CreateNotificationDto
                {
                    UserId = tenantUserId.Value,
                    Title = "Cập nhật tiến độ bảo trì",
                    Content = $"Kính gửi khách thuê {tenantName} (Phòng {roomStr}): Yêu cầu sửa chữa #{request.Id} ({request.Title}) đã chuyển sang trạng thái '{statusText}'.{noteDetail}",
                    Type = "BaoTri"
                }, actorUserId);
            }

            return true;
        }

        public bool CancelOwn(int id, int userId)
        {
            var request = _requestRepository.GetById(id);
            if (request == null || request.Tenant?.UserId != userId || request.Status is not (MaintenanceStatus.Moi or MaintenanceStatus.DaPhanCong))
            {
                return false;
            }

            request.Status = MaintenanceStatus.DaHuy;
            request.ResolvedAt = DateTime.UtcNow;
            request.Note = AppendConversation(request.Note, "Khách thuê", "Đã hủy yêu cầu.");
            _requestRepository.Update(request);
            _activityLogService.Log(userId, "CancelMaintenanceRequest", "MaintenanceRequest", request.Id, null);
            return true;
        }

        public bool AddTenantReply(int id, int userId, string message)
        {
            var request = _requestRepository.GetById(id);
            if (request == null || request.Tenant?.UserId != userId || request.Status is MaintenanceStatus.HoanThanh or MaintenanceStatus.DaHuy || string.IsNullOrWhiteSpace(message))
            {
                return false;
            }

            var reply = message.Trim();
            request.Note = AppendConversation(request.Note, "Khách thuê", reply);
            _requestRepository.Update(request);
            _notificationService.NotifyRole("Admin", "Phản hồi yêu cầu bảo trì", $"Khách thuê đã phản hồi yêu cầu #{request.Id}: {reply}", "BaoTri");
            _notificationService.NotifyRole("Staff", "Phản hồi yêu cầu bảo trì", $"Khách thuê đã phản hồi yêu cầu #{request.Id}: {reply}", "BaoTri");
            _activityLogService.Log(userId, "ReplyMaintenanceRequest", "MaintenanceRequest", request.Id, reply);
            return true;
        }

        private static string AppendConversation(string? current, string speaker, string message)
        {
            var entry = $"{speaker}: {message}";
            return string.IsNullOrWhiteSpace(current) ? entry : $"{current}{Environment.NewLine}{entry}";
        }

        private static MaintenanceRequestDto MapToDto(MaintenanceRequest request)
        {
            return new MaintenanceRequestDto
            {
                Id = request.Id,
                RoomId = request.RoomId,
                RoomNumber = request.Room?.RoomNumber,
                BuildingName = request.Room?.Building?.Name,
                BuildingAddress = request.Room?.Building?.Address,
                LandlordName = request.Room?.Building?.Owner?.FullName,
                LandlordPhone = request.Room?.Building?.Owner?.PhoneNumber,
                TenantId = request.TenantId,
                TenantName = request.Tenant?.FullName,
                TenantPhone = request.Tenant?.Phone,
                Title = request.Title,
                Description = request.Description,
                ImageUrl = request.ImageUrl,
                Priority = request.Priority.ToString(),
                Status = request.Status.ToString(),
                AssignedToUserId = request.AssignedToUserId,
                AssignedToUserName = request.AssignedToUser?.FullName,
                AssignedToUserPhone = request.AssignedToUser?.PhoneNumber,
                CreatedAt = request.CreatedAt,
                ResolvedAt = request.ResolvedAt,
                Note = request.Note
            };
        }
    }
}
