using ShopAPI.Interfaces;

namespace ShopAPI.Services
{
    /// <summary>
    /// Background service chạy mỗi ngày lúc 8:00 sáng, tự động:
    /// 1. Đánh dấu hóa đơn quá hạn → QuaHan và gửi nhắc nhở
    /// 2. Nhắc hóa đơn sắp đến hạn (trong 3 ngày tới)
    /// 3. Nhắc hợp đồng sắp hết hạn (trong 7 ngày tới)
    /// </summary>
    public class DailyReminderService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<DailyReminderService> _logger;

        // ID "user hệ thống" dùng khi ghi ActivityLog cho các tác vụ tự động (0 = system)
        private const int SystemUserId = 0;

        public DailyReminderService(IServiceScopeFactory scopeFactory, ILogger<DailyReminderService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("DailyReminderService started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                var now = DateTime.UtcNow;
                // Tính thời điểm chạy tiếp theo: 8:00 sáng ngày hôm sau (hoặc hôm nay nếu chưa qua 8h)
                var nextRun = now.Hour < 8
                    ? now.Date.AddHours(8)
                    : now.Date.AddDays(1).AddHours(8);

                var delay = nextRun - now;
                _logger.LogInformation("DailyReminderService: next run at {NextRun} (in {Delay:hh\\:mm\\:ss})", nextRun, delay);

                try
                {
                    await Task.Delay(delay, stoppingToken);
                }
                catch (TaskCanceledException)
                {
                    break;
                }

                await RunRemindersAsync(stoppingToken);
            }

            _logger.LogInformation("DailyReminderService stopped.");
        }

        private async Task RunRemindersAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("DailyReminderService: running daily reminders...");

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

                // 1. Hóa đơn quá hạn
                var overdueCount = notificationService.RemindOverdue(SystemUserId);
                _logger.LogInformation("DailyReminderService: RemindOverdue = {Count} hóa đơn", overdueCount);

                // 2. Hóa đơn sắp đến hạn (3 ngày)
                var upcomingInvoiceCount = notificationService.RemindUpcomingInvoices(SystemUserId, daysBefore: 3);
                _logger.LogInformation("DailyReminderService: RemindUpcomingInvoices = {Count} hóa đơn", upcomingInvoiceCount);

                // 3. Hợp đồng sắp hết hạn (7 ngày)
                var upcomingContractCount = notificationService.RemindUpcomingContracts(SystemUserId, daysBefore: 7);
                _logger.LogInformation("DailyReminderService: RemindUpcomingContracts = {Count} hợp đồng", upcomingContractCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "DailyReminderService: error during daily reminders");
            }

            await Task.CompletedTask;
        }
    }
}
