using ShopAPI.Data;
using ShopAPI.DTOs;
using ShopAPI.Interfaces;
using ShopAPI.Models;

namespace ShopAPI.Services
{
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _notificationRepository;
        private readonly IInvoiceRepository _invoiceRepository;
        private readonly IContractRepository _contractRepository;
        private readonly IActivityLogService _activityLogService;
        private readonly AppDbContext _context;

        public NotificationService(
            INotificationRepository notificationRepository,
            IInvoiceRepository invoiceRepository,
            IContractRepository contractRepository,
            IActivityLogService activityLogService,
            AppDbContext context)
        {
            _notificationRepository = notificationRepository;
            _invoiceRepository = invoiceRepository;
            _contractRepository = contractRepository;
            _activityLogService = activityLogService;
            _context = context;
        }

        public List<NotificationDto> GetMy(int userId)
        {
            return _notificationRepository.GetByUserId(userId).Select(MapToDto).ToList();
        }

        public bool MarkRead(int id, int userId)
        {
            var notification = _notificationRepository.GetById(id);

            if (notification == null || notification.UserId != userId)
            {
                return false;
            }

            notification.IsRead = true;
            _notificationRepository.Update(notification);

            return true;
        }

        public NotificationDto Create(CreateNotificationDto dto, int createdByUserId)
        {
            var notification = new Notification
            {
                UserId = dto.UserId,
                Title = dto.Title,
                Content = dto.Content,
                Type = dto.Type,
                CreatedByUserId = createdByUserId,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _notificationRepository.Add(notification);

            return MapToDto(notification);
        }

        public int RemindOverdue(int actorUserId)
        {
            var overdueInvoices = _invoiceRepository.GetAll()
                .Where(i => i.Status == InvoiceStatus.ChuaThanhToan && i.DueDate < DateTime.UtcNow)
                .ToList();

            var count = 0;

            foreach (var invoice in overdueInvoices)
            {
                var userId = invoice.Contract?.Tenant?.UserId;

                if (userId == null)
                {
                    continue;
                }

                invoice.Status = InvoiceStatus.QuaHan;

                var notification = new Notification
                {
                    UserId = userId.Value,
                    Title = "Nháº¯c nhá»Ÿ thanh toĂ¡n hĂ³a Ä‘Æ¡n quĂ¡ háº¡n",
                    Content = $"HĂ³a Ä‘Æ¡n #{invoice.Id} (thĂ¡ng {invoice.Month}/{invoice.Year}) Ä‘Ă£ quĂ¡ háº¡n thanh toĂ¡n {invoice.TotalAmount:N0}Ä‘. Vui lĂ²ng thanh toĂ¡n sá»›m.",
                    Type = "NhacNo",
                    RelatedInvoiceId = invoice.Id,
                    CreatedByUserId = actorUserId,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };

                _notificationRepository.Add(notification);
                _invoiceRepository.Update(invoice);

                count++;
            }

            if (count > 0)
            {
                _activityLogService.Log(actorUserId, "RemindOverdue", "Invoice", null, $"ÄĂ£ nháº¯c ná»£ {count} hĂ³a Ä‘Æ¡n quĂ¡ háº¡n");
            }

            return count;
        }

        public int RemindUpcomingInvoices(int actorUserId, int daysBefore)
        {
            var today = DateTime.UtcNow.Date;
            var threshold = today.AddDays(daysBefore);

            var upcomingInvoices = _invoiceRepository.GetAll()
                .Where(i => i.Status == InvoiceStatus.ChuaThanhToan && i.DueDate.Date >= today && i.DueDate.Date <= threshold)
                .ToList();

            var count = 0;

            foreach (var invoice in upcomingInvoices)
            {
                var tenantUserId = invoice.Contract?.Tenant?.UserId;

                if (tenantUserId == null)
                {
                    continue;
                }

                var alreadyRemindedToday = _context.Notifications.Any(n =>
                    n.RelatedInvoiceId == invoice.Id && n.Type == "NhacNo" && n.CreatedAt.Date == today);

                if (alreadyRemindedToday)
                {
                    continue;
                }

                var daysLeft = (invoice.DueDate.Date - today).Days;
                var tenantName = invoice.Contract?.Tenant?.FullName;
                var content = $"HĂ³a Ä‘Æ¡n #{invoice.Id} (thĂ¡ng {invoice.Month}/{invoice.Year}), sá»‘ tiá»n {invoice.TotalAmount:N0}Ä‘, sáº½ Ä‘áº¿n háº¡n thanh toĂ¡n trong {daysLeft} ngĂ y ({invoice.DueDate:dd/MM/yyyy}).";

                _notificationRepository.Add(new Notification
                {
                    UserId = tenantUserId.Value,
                    Title = "Sáº¯p Ä‘áº¿n háº¡n thanh toĂ¡n hĂ³a Ä‘Æ¡n",
                    Content = content,
                    Type = "NhacNo",
                    RelatedInvoiceId = invoice.Id,
                    CreatedByUserId = actorUserId,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                });

                NotifyRole("Admin", "HĂ³a Ä‘Æ¡n sáº¯p Ä‘áº¿n háº¡n", $"KhĂ¡ch thuĂª {tenantName} - {content}", "NhacNo", invoice.Id);
                NotifyRole("Staff", "HĂ³a Ä‘Æ¡n sáº¯p Ä‘áº¿n háº¡n", $"KhĂ¡ch thuĂª {tenantName} - {content}", "NhacNo", invoice.Id);

                count++;
            }

            if (count > 0)
            {
                _activityLogService.Log(actorUserId, "RemindUpcomingInvoices", "Invoice", null, $"ÄĂ£ nháº¯c {count} hĂ³a Ä‘Æ¡n sáº¯p Ä‘áº¿n háº¡n");
            }

            return count;
        }

        public int RemindUpcomingContracts(int actorUserId, int daysBefore)
        {
            var today = DateTime.UtcNow.Date;
            var threshold = today.AddDays(daysBefore);

            var upcomingContracts = _contractRepository.GetAll()
                .Where(c => c.Status == ContractStatus.DangHieuLuc && c.EndDate.Date >= today && c.EndDate.Date <= threshold)
                .ToList();

            var count = 0;

            foreach (var contract in upcomingContracts)
            {
                var tenantUserId = contract.Tenant?.UserId;

                if (tenantUserId == null)
                {
                    continue;
                }

                var alreadyRemindedToday = _context.Notifications.Any(n =>
                    n.RelatedContractId == contract.Id && n.Type == "HopDong" && n.CreatedAt.Date == today);

                if (alreadyRemindedToday)
                {
                    continue;
                }

                var daysLeft = (contract.EndDate.Date - today).Days;
                var tenantName = contract.Tenant?.FullName;
                var content = $"Há»£p Ä‘á»“ng phĂ²ng {contract.Room?.RoomNumber} sáº½ háº¿t háº¡n trong {daysLeft} ngĂ y ({contract.EndDate:dd/MM/yyyy}). Vui lĂ²ng liĂªn há»‡ gia háº¡n náº¿u cĂ³ nhu cáº§u tiáº¿p tá»¥c thuĂª.";

                _notificationRepository.Add(new Notification
                {
                    UserId = tenantUserId.Value,
                    Title = "Há»£p Ä‘á»“ng sáº¯p háº¿t háº¡n",
                    Content = content,
                    Type = "HopDong",
                    RelatedContractId = contract.Id,
                    CreatedByUserId = actorUserId,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                });

                NotifyRole("Admin", "Há»£p Ä‘á»“ng sáº¯p háº¿t háº¡n", $"KhĂ¡ch thuĂª {tenantName} - {content}", "HopDong", null, contract.Id);
                NotifyRole("Staff", "Há»£p Ä‘á»“ng sáº¯p háº¿t háº¡n", $"KhĂ¡ch thuĂª {tenantName} - {content}", "HopDong", null, contract.Id);

                count++;
            }

            if (count > 0)
            {
                _activityLogService.Log(actorUserId, "RemindUpcomingContracts", "Contract", null, $"ÄĂ£ nháº¯c {count} há»£p Ä‘á»“ng sáº¯p háº¿t háº¡n");
            }

            return count;
        }

        public void NotifyRole(string role, string title, string content, string type, int? relatedInvoiceId = null, int? relatedContractId = null)
        {
            var userIds = _context.Users
                .Where(u => u.Role == role)
                .Select(u => u.Id)
                .ToList();

            foreach (var userId in userIds)
            {
                _notificationRepository.Add(new Notification
                {
                    UserId = userId,
                    Title = title,
                    Content = content,
                    Type = type,
                    RelatedInvoiceId = relatedInvoiceId,
                    RelatedContractId = relatedContractId,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        private static NotificationDto MapToDto(Notification notification)
        {
            return new NotificationDto
            {
                Id = notification.Id,
                UserId = notification.UserId,
                Title = notification.Title,
                Content = notification.Content,
                Type = notification.Type,
                IsRead = notification.IsRead,
                RelatedInvoiceId = notification.RelatedInvoiceId,
                RelatedContractId = notification.RelatedContractId,
                CreatedAt = notification.CreatedAt
            };
        }
    }
}
