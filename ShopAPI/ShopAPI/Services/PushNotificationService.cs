using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ShopAPI.Data;
using ShopAPI.DTOs;
using ShopAPI.Interfaces;
using ShopAPI.Models;
using WebPush;

namespace ShopAPI.Services
{
    public class PushNotificationService : IPushNotificationService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IConfiguration _configuration;
        private readonly ILogger<PushNotificationService> _logger;
        private readonly VapidDetails _vapidDetails;
        private readonly string _publicKey;

        public PushNotificationService(
            IServiceScopeFactory scopeFactory,
            IConfiguration configuration,
            ILogger<PushNotificationService> logger)
        {
            _scopeFactory = scopeFactory;
            _configuration = configuration;
            _logger = logger;

            var subject = _configuration["WebPush:VapidSubject"] ?? "mailto:admin@trohub.local";
            _publicKey = _configuration["WebPush:PublicKey"] ?? "";
            var privateKey = _configuration["WebPush:PrivateKey"] ?? "";

            _vapidDetails = new VapidDetails(subject, _publicKey, privateKey);
        }

        public string GetVapidPublicKey() => _publicKey;

        public async Task<PushStatusDto> GetStatusAsync(int userId, string? endpoint = null)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var count = await context.PushSubscriptions.CountAsync(p => p.UserId == userId);
            var isSubscribed = !string.IsNullOrWhiteSpace(endpoint) &&
                               await context.PushSubscriptions.AnyAsync(p => p.UserId == userId && p.Endpoint == endpoint);

            return new PushStatusDto
            {
                IsSupported = !string.IsNullOrWhiteSpace(_publicKey),
                VapidPublicKey = _publicKey,
                SubscribedDevicesCount = count,
                IsDeviceSubscribed = isSubscribed
            };
        }

        public async Task SubscribeAsync(int userId, SubscribePushDto dto)
        {
            var p256dh = dto.Keys?.P256dh ?? dto.P256dh;
            var auth = dto.Keys?.Auth ?? dto.Auth;

            if (string.IsNullOrWhiteSpace(dto.Endpoint) || string.IsNullOrWhiteSpace(p256dh) || string.IsNullOrWhiteSpace(auth))
            {
                throw new ArgumentException("Thông tin đăng ký Push không hợp lệ (thiếu endpoint, p256dh hoặc auth).");
            }

            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var existing = await context.PushSubscriptions.FirstOrDefaultAsync(p => p.Endpoint == dto.Endpoint);
            if (existing != null)
            {
                existing.UserId = userId;
                existing.P256dh = p256dh;
                existing.Auth = auth;
                existing.DeviceDescription = dto.DeviceDescription ?? existing.DeviceDescription;
                existing.CreatedAt = DateTime.UtcNow;
            }
            else
            {
                context.PushSubscriptions.Add(new ShopAPI.Models.PushSubscription
                {
                    UserId = userId,
                    Endpoint = dto.Endpoint,
                    P256dh = p256dh,
                    Auth = auth,
                    DeviceDescription = dto.DeviceDescription,
                    CreatedAt = DateTime.UtcNow
                });
            }

            await context.SaveChangesAsync();
            _logger.LogInformation("User {UserId} registered push subscription: {Endpoint}", userId, dto.Endpoint);
        }

        public async Task UnsubscribeAsync(int userId, string endpoint)
        {
            if (string.IsNullOrWhiteSpace(endpoint)) return;

            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var sub = await context.PushSubscriptions.FirstOrDefaultAsync(p => p.UserId == userId && p.Endpoint == endpoint);
            if (sub != null)
            {
                context.PushSubscriptions.Remove(sub);
                await context.SaveChangesAsync();
                _logger.LogInformation("User {UserId} removed push subscription: {Endpoint}", userId, endpoint);
            }
        }

        public async Task<bool> SendTestPushAsync(int userId, string? title = null, string? content = null, string? url = null)
        {
            var testTitle = !string.IsNullOrWhiteSpace(title) ? title : "🔔 Thông báo thử nghiệm từ TroHub";
            var testBody = !string.IsNullOrWhiteSpace(content) ? content : "Tuyệt vời! Thiết bị của bạn đã nhận được thông báo đẩy thành công ngay cả khi đóng web.";
            var testUrl = !string.IsNullOrWhiteSpace(url) ? url : "/thong-bao";

            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var subs = await context.PushSubscriptions.Where(p => p.UserId == userId).ToListAsync();
            if (subs.Count == 0) return false;

            foreach (var sub in subs)
            {
                await SendSinglePushAsync(sub.Id, sub.Endpoint, sub.P256dh, sub.Auth, testTitle, testBody, testUrl);
            }

            return true;
        }

        public Task SendPushToUserAsync(int userId, string title, string body, string? url = null)
        {
            // Chạy trong background task để không làm chậm response của API
            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                    var subs = await context.PushSubscriptions.Where(p => p.UserId == userId).ToListAsync();
                    foreach (var sub in subs)
                    {
                        await SendSinglePushAsync(sub.Id, sub.Endpoint, sub.P256dh, sub.Auth, title, body, url);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi gửi Web Push cho User {UserId}", userId);
                }
            });

            return Task.CompletedTask;
        }

        public Task SendPushToRoleAsync(string role, string title, string body, string? url = null)
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                    var subs = await context.PushSubscriptions
                        .Include(p => p.User)
                        .Where(p => p.User != null && p.User.Role == role)
                        .ToListAsync();

                    foreach (var sub in subs)
                    {
                        await SendSinglePushAsync(sub.Id, sub.Endpoint, sub.P256dh, sub.Auth, title, body, url);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi gửi Web Push cho Role {Role}", role);
                }
            });

            return Task.CompletedTask;
        }

        public Task SendPushToAllAsync(string title, string body, string? url = null)
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                    var subs = await context.PushSubscriptions.ToListAsync();
                    foreach (var sub in subs)
                    {
                        await SendSinglePushAsync(sub.Id, sub.Endpoint, sub.P256dh, sub.Auth, title, body, url);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi gửi Web Push cho toàn bộ thiết bị");
                }
            });

            return Task.CompletedTask;
        }

        private async Task SendSinglePushAsync(int subscriptionId, string endpoint, string p256dh, string auth, string title, string body, string? url)
        {
            if (string.IsNullOrWhiteSpace(_publicKey) || string.IsNullOrWhiteSpace(_vapidDetails.PrivateKey))
            {
                _logger.LogWarning("Chưa cấu hình VAPID Keys nên không thể gửi Push Notification.");
                return;
            }

            try
            {
                var pushSubscription = new WebPush.PushSubscription(endpoint, p256dh, auth);
                var client = new WebPushClient();

                var payload = JsonSerializer.Serialize(new
                {
                    title,
                    body,
                    icon = "/favicon.svg",
                    badge = "/favicon.svg",
                    url = !string.IsNullOrWhiteSpace(url) ? url : "/thong-bao",
                    timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                });

                await client.SendNotificationAsync(pushSubscription, payload, _vapidDetails);
                _logger.LogInformation("Đã đẩy Web Push thành công tới: {Endpoint}", endpoint);
            }
            catch (WebPushException ex)
            {
                _logger.LogWarning("Lỗi khi gửi Web Push ({StatusCode}): {Message}", ex.StatusCode, ex.Message);

                // Nếu thiết bị đã thu hồi quyền hoặc hết hạn (Gone 410, NotFound 404), xóa khỏi DB
                if (ex.StatusCode == HttpStatusCode.Gone || ex.StatusCode == HttpStatusCode.NotFound)
                {
                    try
                    {
                        using var cleanupScope = _scopeFactory.CreateScope();
                        var db = cleanupScope.ServiceProvider.GetRequiredService<AppDbContext>();
                        var deadSub = await db.PushSubscriptions.FindAsync(subscriptionId);
                        if (deadSub != null)
                        {
                            db.PushSubscriptions.Remove(deadSub);
                            await db.SaveChangesAsync();
                            _logger.LogInformation("Đã xóa subscription hết hạn #{Id}", subscriptionId);
                        }
                    }
                    catch (Exception cleanupEx)
                    {
                        _logger.LogError(cleanupEx, "Không thể dọn dẹp subscription chết #{Id}", subscriptionId);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi không xác định khi gửi Web Push tới {Endpoint}", endpoint);
            }
        }
    }
}

