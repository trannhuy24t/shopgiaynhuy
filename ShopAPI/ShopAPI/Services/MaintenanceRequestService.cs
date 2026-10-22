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

        public MaintenanceRequestService(
            IMaintenanceRequestRepository requestRepository,
            IContractRepository contractRepository,
            ITenantService tenantService,
            INotificationService notificationService,
            IActivityLogService activityLogService)
        {
            _requestRepository = requestRepository;
            _contractRepository = contractRepository;
            _tenantService = tenantService;
            _notificationService = notificationService;
            _activityLogService = activityLogService;
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

            var content = $"KhĂ¡ch thuĂª {tenant.FullName} bĂ¡o sá»± cá»‘ táº¡i phĂ²ng {result?.RoomNumber}: {dto.Title}";
            _notificationService.NotifyRole("Admin", "YĂªu cáº§u báº£o trĂ¬ má»›i", content, "BaoTri");
            _notificationService.NotifyRole("Staff", "YĂªu cáº§u báº£o trĂ¬ má»›i", content, "BaoTri");

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
                TenantId = request.TenantId,
                TenantName = request.Tenant?.FullName,
                Title = request.Title,
                Description = request.Description,
                ImageUrl = request.ImageUrl,
                Priority = request.Priority.ToString(),
                Status = request.Status.ToString(),
                AssignedToUserId = request.AssignedToUserId,
                AssignedToUserName = request.AssignedToUser?.FullName,
                CreatedAt = request.CreatedAt,
                ResolvedAt = request.ResolvedAt,
                Note = request.Note
            };
        }
    }
}
