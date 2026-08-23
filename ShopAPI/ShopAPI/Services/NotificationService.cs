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
                CreatedAt = DateTime.Now
            };

            _notificationRepository.Add(notification);

            return MapToDto(notification);
        }

        public int RemindOverdue(int actorUserId)
        {
            var overdueInvoices = _invoiceRepository.GetAll()
                .Where(i => i.Status == "ChuaThanhToan" && i.DueDate < DateTime.Now)
                .ToList();

            var count = 0;

            foreach (var invoice in overdueInvoices)
            {
                var userId = invoice.Contract?.Tenant?.UserId;

                if (userId == null)
                {
                    continue;
                }

                invoice.Status = "QuaHan";

                var notification = new Notification
                {
                    UserId = userId.Value,
                    Title = "Nhắc nhở thanh toán hóa đơn quá hạn",
                    Content = $"Hóa đơn #{invoice.Id} (tháng {invoice.Month}/{invoice.Year}) đã quá hạn thanh toán {invoice.TotalAmount:N0}đ. Vui lòng thanh toán sớm.",
                    Type = "NhacNo",
                    RelatedInvoiceId = invoice.Id,
                    CreatedByUserId = actorUserId,
                    IsRead = false,
                    CreatedAt = DateTime.Now
                };

                _notificationRepository.Add(notification);
                _invoiceRepository.Update(invoice);

                count++;
            }

            if (count > 0)
            {
                _activityLogService.Log(actorUserId, "RemindOverdue", "Invoice", null, $"Đã nhắc nợ {count} hóa đơn quá hạn");
            }

            return count;
        }

        public int RemindUpcomingInvoices(int actorUserId, int daysBefore)
        {
            var today = DateTime.Now.Date;
            var threshold = today.AddDays(daysBefore);

            var upcomingInvoices = _invoiceRepository.GetAll()
                .Where(i => i.Status == "ChuaThanhToan" && i.DueDate.Date >= today && i.DueDate.Date <= threshold)
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
                var content = $"Hóa đơn #{invoice.Id} (tháng {invoice.Month}/{invoice.Year}), số tiền {invoice.TotalAmount:N0}đ, sẽ đến hạn thanh toán trong {daysLeft} ngày ({invoice.DueDate:dd/MM/yyyy}).";

                _notificationRepository.Add(new Notification
                {
                    UserId = tenantUserId.Value,
                    Title = "Sắp đến hạn thanh toán hóa đơn",
                    Content = content,
                    Type = "NhacNo",
                    RelatedInvoiceId = invoice.Id,
                    CreatedByUserId = actorUserId,
                    IsRead = false,
                    CreatedAt = DateTime.Now
                });

                NotifyRole("Admin", "Hóa đơn sắp đến hạn", $"Khách thuê {tenantName} - {content}", "NhacNo", invoice.Id);
                NotifyRole("Staff", "Hóa đơn sắp đến hạn", $"Khách thuê {tenantName} - {content}", "NhacNo", invoice.Id);

                count++;
            }

            if (count > 0)
            {
                _activityLogService.Log(actorUserId, "RemindUpcomingInvoices", "Invoice", null, $"Đã nhắc {count} hóa đơn sắp đến hạn");
            }

            return count;
        }

        public int RemindUpcomingContracts(int actorUserId, int daysBefore)
        {
            var today = DateTime.Now.Date;
            var threshold = today.AddDays(daysBefore);

            var upcomingContracts = _contractRepository.GetAll()
                .Where(c => c.Status == "DangHieuLuc" && c.EndDate.Date >= today && c.EndDate.Date <= threshold)
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
                var content = $"Hợp đồng phòng {contract.Room?.RoomNumber} sẽ hết hạn trong {daysLeft} ngày ({contract.EndDate:dd/MM/yyyy}). Vui lòng liên hệ gia hạn nếu có nhu cầu tiếp tục thuê.";

                _notificationRepository.Add(new Notification
                {
                    UserId = tenantUserId.Value,
                    Title = "Hợp đồng sắp hết hạn",
                    Content = content,
                    Type = "HopDong",
                    RelatedContractId = contract.Id,
                    CreatedByUserId = actorUserId,
                    IsRead = false,
                    CreatedAt = DateTime.Now
                });

                NotifyRole("Admin", "Hợp đồng sắp hết hạn", $"Khách thuê {tenantName} - {content}", "HopDong", null, contract.Id);
                NotifyRole("Staff", "Hợp đồng sắp hết hạn", $"Khách thuê {tenantName} - {content}", "HopDong", null, contract.Id);

                count++;
            }

            if (count > 0)
            {
                _activityLogService.Log(actorUserId, "RemindUpcomingContracts", "Contract", null, $"Đã nhắc {count} hợp đồng sắp hết hạn");
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
                    CreatedAt = DateTime.Now
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
