using System.Net;
using Microsoft.EntityFrameworkCore;
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
        private readonly IPushNotificationService _pushNotificationService;
        private readonly ITelegramBotService _telegramBotService;
        private readonly AppDbContext _context;

        public NotificationService(
            INotificationRepository notificationRepository,
            IInvoiceRepository invoiceRepository,
            IContractRepository contractRepository,
            IActivityLogService activityLogService,
            IPushNotificationService pushNotificationService,
            ITelegramBotService telegramBotService,
            AppDbContext context)
        {
            _notificationRepository = notificationRepository;
            _invoiceRepository = invoiceRepository;
            _contractRepository = contractRepository;
            _activityLogService = activityLogService;
            _pushNotificationService = pushNotificationService;
            _telegramBotService = telegramBotService;
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

        public NotificationDto Create(CreateNotificationDto dto, int? createdByUserId = null)
        {
            var notification = new Notification
            {
                UserId = dto.UserId,
                Title = dto.Title,
                Content = dto.Content,
                Type = dto.Type,
                RelatedInvoiceId = dto.RelatedInvoiceId,
                RelatedContractId = dto.RelatedContractId,
                CreatedByUserId = createdByUserId,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _notificationRepository.Add(notification);

            var targetUrl = ResolveTargetUrl(dto.Type, dto.RelatedInvoiceId, dto.RelatedContractId);
            _pushNotificationService.SendPushToUserAsync(dto.UserId, dto.Title, dto.Content, targetUrl);

            // Bắn tự động sang Telegram (Cá nhân & Nhóm chung)
            try
            {
                // Tìm thông tin Tenant hoặc User
                var tenant = _context.Tenants
                    .Include(t => t.Contracts)
                    .ThenInclude(c => c.Room)
                    .FirstOrDefault(t => t.UserId == dto.UserId || t.Id == dto.UserId);

                var targetUser = _context.Users.Find(dto.UserId) ?? (tenant != null ? _context.Users.Find(tenant.UserId) : null);

                // Xác định danh tính chi tiết của người nhận: Tên, SĐT, Số phòng
                string recipientName = tenant?.FullName ?? targetUser?.FullName ?? ("Người dùng #" + dto.UserId);
                string recipientDetails;

                if (tenant != null)
                {
                    var activeRoom = tenant.Contracts
                        .Where(c => c.Status == ContractStatus.DangHieuLuc)
                        .Select(c => c.Room?.RoomNumber)
                        .FirstOrDefault()
                        ?? tenant.Contracts.OrderByDescending(c => c.Id).Select(c => c.Room?.RoomNumber).FirstOrDefault();

                    var roomPart = !string.IsNullOrEmpty(activeRoom) ? $" - Phòng {activeRoom}" : "";
                    var phonePart = !string.IsNullOrEmpty(tenant.Phone) ? $" (SĐT: {tenant.Phone})" : "";
                    recipientDetails = $"Khách thuê {tenant.FullName}{phonePart}{roomPart}";
                }
                else if (targetUser != null)
                {
                    var rolePart = targetUser.Role switch
                    {
                        "Staff" => "Kỹ thuật viên / Nhân viên",
                        "Admin" => "Ban Quản Lý / Quản trị",
                        _ => targetUser.Role
                    };
                    var phonePart = !string.IsNullOrEmpty(targetUser.PhoneNumber) ? $" (SĐT: {targetUser.PhoneNumber})" : "";
                    recipientDetails = $"{targetUser.FullName}{phonePart} [{rolePart}]";
                }
                else
                {
                    recipientDetails = recipientName;
                }

                var nowStr = DateTime.Now.ToString("HH:mm dd/MM/yyyy");

                // Mẫu tin nhắn chuẩn hóa luôn nêu rõ tên người nhận:
                var standardizedMsg = $"🔔 <b>[TROHUB] {WebUtility.HtmlEncode(dto.Title)}</b>\n" +
                                      $"👤 <b>Người nhận:</b> <b>{WebUtility.HtmlEncode(recipientDetails)}</b>\n" +
                                      $"📝 <b>Nội dung:</b> {WebUtility.HtmlEncode(dto.Content)}\n" +
                                      $"⏰ <i>Thời gian: {nowStr}</i>";

                // 1. Tin nhắn gửi riêng 1-1 cho người nhận (nếu khách thuê/nhân viên đó có liên kết Telegram)
                if (!string.IsNullOrEmpty(targetUser?.TelegramChatId))
                {
                    _ = _telegramBotService.SendPersonalMessageAsync(targetUser.TelegramChatId, standardizedMsg);
                }

                // 2. LUÔN LUÔN gửi vào nhóm chung Ban Quản Lý để cả nhóm cùng theo dõi (có nêu đích danh tên người nhận)
                _ = _telegramBotService.SendGroupMessageAsync(standardizedMsg);
            }
            catch
            {
                // Fault tolerance: không bao giờ để lỗi Telegram làm gián đoạn lưu thông báo
            }

            return MapToDto(notification);
        }

        public int CreateForAllTenants(BroadcastNotificationDto dto, int createdByUserId)
        {
            var tenantUserIds = _context.Users.Where(user => user.Role == "Tenant").Select(user => user.Id).ToList();
            var createdAt = DateTime.UtcNow;
            var notifications = tenantUserIds.Select(userId => new Notification
            {
                UserId = userId,
                Title = dto.Title,
                Content = dto.Content,
                Type = dto.Type,
                RelatedInvoiceId = dto.RelatedInvoiceId,
                RelatedContractId = dto.RelatedContractId,
                CreatedByUserId = createdByUserId,
                IsRead = false,
                CreatedAt = createdAt
            }).ToList();

            _context.Notifications.AddRange(notifications);
            _context.SaveChanges();
            _activityLogService.Log(createdByUserId, "BroadcastNotification", "Notification", null, $"Recipients={notifications.Count}; Title={dto.Title}");

            _pushNotificationService.SendPushToRoleAsync("Tenant", dto.Title, dto.Content, "/thong-bao");

            // Bắn sang Telegram: Group ban quản lý và từng khách thuê có liên kết ChatId
            try
            {
                var nowStr = DateTime.Now.ToString("HH:mm dd/MM/yyyy");
                var groupMsg = $"📢 <b>[TROHUB - THÔNG BÁO HÀNG LOẠT]</b>\n" +
                               $"🔔 <b>Tiêu đề:</b> {WebUtility.HtmlEncode(dto.Title)}\n" +
                               $"📝 <b>Nội dung:</b> {WebUtility.HtmlEncode(dto.Content)}\n" +
                               $"👥 <i>Đã gửi tới tất cả {notifications.Count} khách thuê trong hệ thống.</i>\n" +
                               $"⏰ <i>Thời gian: {nowStr}</i>";
                _ = _telegramBotService.SendGroupMessageAsync(groupMsg);

                var tenantsWithTelegram = _context.Users
                    .Where(u => u.Role == "Tenant" && !string.IsNullOrEmpty(u.TelegramChatId))
                    .Select(u => new { u.TelegramChatId, u.FullName })
                    .ToList();

                foreach (var tenant in tenantsWithTelegram)
                {
                    var personalMsg = $"🔔 <b>[TROHUB] {WebUtility.HtmlEncode(dto.Title)}</b>\n" +
                                      $"Kính gửi khách thuê: <b>{WebUtility.HtmlEncode(tenant.FullName)}</b>\n\n" +
                                      $"{WebUtility.HtmlEncode(dto.Content)}\n\n" +
                                      $"⏰ <i>Thời gian: {nowStr}</i>";
                    _ = _telegramBotService.SendPersonalMessageAsync(tenant.TelegramChatId, personalMsg);
                }
            }
            catch
            {
                // Fault tolerance
            }

            return notifications.Count;
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

                var tenantName = invoice.Contract?.Tenant?.FullName ?? "Khách thuê";
                var tenantPhone = !string.IsNullOrWhiteSpace(invoice.Contract?.Tenant?.Phone) ? $" - SĐT: {invoice.Contract.Tenant.Phone}" : "";
                var roomNumber = invoice.Contract?.Room?.RoomNumber ?? "N/A";
                var buildingName = !string.IsNullOrWhiteSpace(invoice.Contract?.Room?.Building?.Name) ? $" ({invoice.Contract.Room.Building.Name})" : "";

                var content = $"Khách thuê {tenantName}{tenantPhone} (Phòng {roomNumber}{buildingName}): Hóa đơn #{invoice.Id} (tháng {invoice.Month}/{invoice.Year}) với tổng tiền {invoice.TotalAmount:N0}đ đã quá hạn thanh toán. Vui lòng thanh toán sớm để đảm bảo dịch vụ sinh hoạt.";

                var notification = new Notification
                {
                    UserId = userId.Value,
                    Title = "Nhắc nhở thanh toán hóa đơn quá hạn",
                    Content = content,
                    Type = "NhacNo",
                    RelatedInvoiceId = invoice.Id,
                    CreatedByUserId = actorUserId,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };

                _notificationRepository.Add(notification);
                _invoiceRepository.Update(invoice);

                _pushNotificationService.SendPushToUserAsync(userId.Value, notification.Title, notification.Content, "/hoa-don-cua-toi");

                // Bắn sang Telegram: gửi riêng cho khách và cảnh báo nhóm quản lý nêu đích danh khách thuê
                try
                {
                    var nowStr = DateTime.Now.ToString("HH:mm dd/MM/yyyy");
                    var tenantUser = invoice.Contract?.Tenant?.User ?? _context.Users.Find(userId.Value);

                    if (!string.IsNullOrEmpty(tenantUser?.TelegramChatId))
                    {
                        var personalMsg = $"🔔 <b>[TROHUB] {notification.Title}</b>\n" +
                                          $"Kính gửi khách thuê: <b>{WebUtility.HtmlEncode(tenantName)}</b> (Phòng {WebUtility.HtmlEncode(roomNumber)}),\n\n" +
                                          $"{WebUtility.HtmlEncode(content)}\n\n" +
                                          $"⏰ <i>Thời gian: {nowStr}</i>";
                        _ = _telegramBotService.SendPersonalMessageAsync(tenantUser.TelegramChatId, personalMsg);
                    }

                    var groupMsg = $"🚨 <b>[CẢNH BÁO NỢ QUÁ HẠN]</b>\n" +
                                   $"👤 <b>Khách thuê:</b> <b>{WebUtility.HtmlEncode(tenantName)}</b>{WebUtility.HtmlEncode(tenantPhone)}\n" +
                                   $"🏠 <b>Địa điểm:</b> Phòng {WebUtility.HtmlEncode(roomNumber)}{WebUtility.HtmlEncode(buildingName)}\n" +
                                   $"💵 <b>Số tiền quá hạn:</b> <b>{invoice.TotalAmount:N0} VNĐ</b> (Hóa đơn #{invoice.Id} - Tháng {invoice.Month}/{invoice.Year})\n" +
                                   $"📝 <b>Nội dung:</b> {WebUtility.HtmlEncode(content)}\n" +
                                   $"⏰ <i>Thời gian: {nowStr}</i>";
                    _ = _telegramBotService.SendGroupMessageAsync(groupMsg);
                }
                catch
                {
                    // Fault tolerance
                }

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
                var tenantName = invoice.Contract?.Tenant?.FullName ?? "Khách thuê";
                var tenantPhone = !string.IsNullOrWhiteSpace(invoice.Contract?.Tenant?.Phone) ? $" - SĐT: {invoice.Contract.Tenant.Phone}" : "";
                var roomNumber = invoice.Contract?.Room?.RoomNumber ?? "N/A";
                var buildingName = !string.IsNullOrWhiteSpace(invoice.Contract?.Room?.Building?.Name) ? $" ({invoice.Contract.Room.Building.Name})" : "";

                var content = $"Khách thuê {tenantName}{tenantPhone} (Phòng {roomNumber}{buildingName}): Hóa đơn #{invoice.Id} tháng {invoice.Month}/{invoice.Year} số tiền {invoice.TotalAmount:N0}đ sẽ đến hạn thanh toán trong {daysLeft} ngày (hạn chót: {invoice.DueDate:dd/MM/yyyy}).";

                _notificationRepository.Add(new Notification
                {
                    UserId = tenantUserId.Value,
                    Title = "Sắp đến hạn thanh toán hóa đơn",
                    Content = content,
                    Type = "NhacNo",
                    RelatedInvoiceId = invoice.Id,
                    CreatedByUserId = actorUserId,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                });

                _pushNotificationService.SendPushToUserAsync(tenantUserId.Value, "Sắp đến hạn thanh toán hóa đơn", content, "/hoa-don-cua-toi");

                NotifyRoleUsersOnly("Admin", "Hóa đơn sắp đến hạn", content, "NhacNo", invoice.Id);
                NotifyRoleUsersOnly("Staff", "Hóa đơn sắp đến hạn", content, "NhacNo", invoice.Id);

                // Bắn sang Telegram: gửi riêng cho khách và nhóm ban quản lý
                try
                {
                    var nowStr = DateTime.Now.ToString("HH:mm dd/MM/yyyy");
                    var tenantUser = invoice.Contract?.Tenant?.User ?? _context.Users.Find(tenantUserId.Value);

                    if (!string.IsNullOrEmpty(tenantUser?.TelegramChatId))
                    {
                        var personalMsg = $"🔔 <b>[TROHUB] Sắp đến hạn thanh toán hóa đơn</b>\n" +
                                          $"Kính gửi khách thuê: <b>{WebUtility.HtmlEncode(tenantName)}</b> (Phòng {WebUtility.HtmlEncode(roomNumber)}),\n\n" +
                                          $"{WebUtility.HtmlEncode(content)}\n\n" +
                                          $"⏰ <i>Thời gian: {nowStr}</i>";
                        _ = _telegramBotService.SendPersonalMessageAsync(tenantUser.TelegramChatId, personalMsg);
                    }

                    var groupMsg = $"⏰ <b>[THÔNG BÁO HÓA ĐƠN SẮP ĐẾN HẠN]</b>\n" +
                                   $"👤 <b>Khách thuê:</b> <b>{WebUtility.HtmlEncode(tenantName)}</b>{WebUtility.HtmlEncode(tenantPhone)}\n" +
                                   $"🏠 <b>Phòng:</b> {WebUtility.HtmlEncode(roomNumber)}{WebUtility.HtmlEncode(buildingName)}\n" +
                                   $"💵 <b>Số tiền:</b> <b>{invoice.TotalAmount:N0} VNĐ</b>\n" +
                                   $"📅 <b>Hạn thanh toán:</b> {invoice.DueDate:dd/MM/yyyy} (còn <b>{daysLeft} ngày</b>)\n" +
                                   $"📝 <b>Nội dung:</b> {WebUtility.HtmlEncode(content)}\n" +
                                   $"⏰ <i>Thời gian: {nowStr}</i>";
                    _ = _telegramBotService.SendGroupMessageAsync(groupMsg);
                }
                catch
                {
                    // Fault tolerance
                }

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
                var tenantName = contract.Tenant?.FullName ?? "Khách thuê";
                var tenantPhone = !string.IsNullOrWhiteSpace(contract.Tenant?.Phone) ? $" - SĐT: {contract.Tenant.Phone}" : "";
                var roomNumber = contract.Room?.RoomNumber ?? contract.RoomId.ToString();
                var buildingName = !string.IsNullOrWhiteSpace(contract.Room?.Building?.Name) ? $" ({contract.Room.Building.Name})" : "";

                var content = $"Hợp đồng thuê phòng {roomNumber}{buildingName} của khách thuê {tenantName}{tenantPhone} sẽ hết hạn vào ngày {contract.EndDate:dd/MM/yyyy} (còn {daysLeft} ngày). Quý khách vui lòng liên hệ Ban Quản Lý để làm thủ tục gia hạn hợp đồng.";

                _notificationRepository.Add(new Notification
                {
                    UserId = tenantUserId.Value,
                    Title = "Hợp đồng sắp hết hạn",
                    Content = content,
                    Type = "HopDong",
                    RelatedContractId = contract.Id,
                    CreatedByUserId = actorUserId,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                });

                _pushNotificationService.SendPushToUserAsync(tenantUserId.Value, "Hợp đồng sắp hết hạn", content, "/hop-dong-cua-toi");

                NotifyRoleUsersOnly("Admin", "Hợp đồng sắp hết hạn", content, "HopDong", null, contract.Id);
                NotifyRoleUsersOnly("Staff", "Hợp đồng sắp hết hạn", content, "HopDong", null, contract.Id);

                // Bắn sang Telegram: gửi riêng cho từng khách thuê sắp hết hạn & gửi cảnh báo nêu rõ tên khách vào nhóm Ban Quản Lý
                try
                {
                    var nowStr = DateTime.Now.ToString("HH:mm dd/MM/yyyy");
                    var tenantUser = contract.Tenant?.User ?? _context.Users.Find(tenantUserId.Value);

                    // 1. Gửi tin riêng cho khách thuê
                    if (!string.IsNullOrEmpty(tenantUser?.TelegramChatId))
                    {
                        var personalMsg = $"🔔 <b>[TROHUB] Hợp đồng sắp hết hạn</b>\n" +
                                          $"Kính gửi khách thuê: <b>{WebUtility.HtmlEncode(tenantName)}</b> (Phòng {WebUtility.HtmlEncode(roomNumber)}),\n\n" +
                                          $"{WebUtility.HtmlEncode(content)}\n\n" +
                                          $"⏰ <i>Thời gian: {nowStr}</i>";
                        _ = _telegramBotService.SendPersonalMessageAsync(tenantUser.TelegramChatId, personalMsg);
                    }

                    // 2. Cảnh báo nhóm Ban Quản Lý nêu đích danh khách thuê
                    var groupMsg = $"⚠️ <b>[CẢNH BÁO HẾT HẠN HỢP ĐỒNG]</b>\n" +
                                   $"👤 <b>Khách thuê:</b> <b>{WebUtility.HtmlEncode(tenantName)}</b>{WebUtility.HtmlEncode(tenantPhone)}\n" +
                                   $"🏠 <b>Phòng:</b> {WebUtility.HtmlEncode(roomNumber)}{WebUtility.HtmlEncode(buildingName)}\n" +
                                   $"📅 <b>Ngày hết hạn:</b> {contract.EndDate:dd/MM/yyyy} (còn <b>{daysLeft} ngày</b>)\n" +
                                   $"📝 <b>Nội dung:</b> {WebUtility.HtmlEncode(content)}\n" +
                                   $"⏰ <i>Thời gian: {nowStr}</i>";
                    _ = _telegramBotService.SendGroupMessageAsync(groupMsg);
                }
                catch
                {
                    // Fault tolerance
                }

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
                    CreatedAt = DateTime.UtcNow
                });
            }

            var targetUrl = role == "Tenant" ? ResolveTargetUrl(type, relatedInvoiceId, relatedContractId) :
                            type == "BaoTri" ? "/admin/maintenance" :
                            type == "HoaDon" || type == "NhacNo" ? "/admin/invoices" :
                            type == "HopDong" ? "/admin/contracts" : "/admin/notifications";

            _pushNotificationService.SendPushToRoleAsync(role, title, content, targetUrl);

            // Bắn sang Telegram: chỉ gửi vào nhóm chung 1 lần nếu là Admin
            try
            {
                var nowStr = DateTime.Now.ToString("HH:mm dd/MM/yyyy");

                if (role == "Admin")
                {
                    var groupMsg = $"🔔 <b>[TROHUB] {WebUtility.HtmlEncode(title)}</b>\n" +
                                   $"{WebUtility.HtmlEncode(content)}\n" +
                                   $"⏰ <i>Thời gian: {nowStr}</i>";
                    _ = _telegramBotService.SendGroupMessageAsync(groupMsg);
                }

                var usersWithTelegram = _context.Users
                    .Where(u => u.Role == role && !string.IsNullOrEmpty(u.TelegramChatId))
                    .ToList();

                foreach (var user in usersWithTelegram)
                {
                    var personalMsg = $"🔔 <b>[TROHUB] {WebUtility.HtmlEncode(title)}</b>\n" +
                                      $"Kính gửi: <b>{WebUtility.HtmlEncode(user.FullName)}</b>,\n\n" +
                                      $"{WebUtility.HtmlEncode(content)}\n\n" +
                                      $"⏰ <i>Thời gian: {nowStr}</i>";
                    _ = _telegramBotService.SendPersonalMessageAsync(user.TelegramChatId, personalMsg);
                }
            }
            catch
            {
                // Fault tolerance
            }
        }

        private void NotifyRoleUsersOnly(string role, string title, string content, string type, int? relatedInvoiceId = null, int? relatedContractId = null)
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

            var targetUrl = role == "Tenant" ? ResolveTargetUrl(type, relatedInvoiceId, relatedContractId) :
                            type == "BaoTri" ? "/admin/maintenance" :
                            type == "HoaDon" || type == "NhacNo" ? "/admin/invoices" :
                            type == "HopDong" ? "/admin/contracts" : "/admin/notifications";

            _pushNotificationService.SendPushToRoleAsync(role, title, content, targetUrl);
        }

        private static string FormatTelegramMessage(string title, string content)
        {
            var nowStr = DateTime.Now.ToString("HH:mm dd/MM/yyyy");
            return $"🔔 <b>[TROHUB] {WebUtility.HtmlEncode(title)}</b>\n{WebUtility.HtmlEncode(content)}\n⏰ <i>Thời gian: {nowStr}</i>";
        }

        private static string ResolveTargetUrl(string type, int? relatedInvoiceId = null, int? relatedContractId = null)
        {
            if (relatedInvoiceId.HasValue) return "/hoa-don-cua-toi";
            if (relatedContractId.HasValue) return "/hop-dong-cua-toi";
            if (type == "BaoTri") return "/yeu-cau-bao-tri";
            return "/thong-bao";
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
