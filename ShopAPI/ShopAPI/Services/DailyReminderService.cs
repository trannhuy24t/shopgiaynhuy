using ShopAPI.Interfaces;

namespace ShopAPI.Services
{
    /// <summary>
    /// Background service cháº¡y má»—i ngĂ y lĂºc 8:00 sĂ¡ng, tá»± Ä‘á»™ng:
    /// 1. ÄĂ¡nh dáº¥u hĂ³a Ä‘Æ¡n quĂ¡ háº¡n â†’ QuaHan vĂ  gá»­i nháº¯c nhá»Ÿ
    /// 2. Nháº¯c hĂ³a Ä‘Æ¡n sáº¯p Ä‘áº¿n háº¡n (trong 3 ngĂ y tá»›i)
    /// 3. Nháº¯c há»£p Ä‘á»“ng sáº¯p háº¿t háº¡n (trong 7 ngĂ y tá»›i)
    /// </summary>
    public class DailyReminderService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<DailyReminderService> _logger;

        // ID "user há»‡ thá»‘ng" dĂ¹ng khi ghi ActivityLog cho cĂ¡c tĂ¡c vá»¥ tá»± Ä‘á»™ng (0 = system)
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
                // TĂ­nh thá»i Ä‘iá»ƒm cháº¡y tiáº¿p theo: 8:00 sĂ¡ng ngĂ y hĂ´m sau (hoáº·c hĂ´m nay náº¿u chÆ°a qua 8h)
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

                // 1. HĂ³a Ä‘Æ¡n quĂ¡ háº¡n
                var overdueCount = notificationService.RemindOverdue(SystemUserId);
                _logger.LogInformation("DailyReminderService: RemindOverdue = {Count} hĂ³a Ä‘Æ¡n", overdueCount);

                // 2. HĂ³a Ä‘Æ¡n sáº¯p Ä‘áº¿n háº¡n (3 ngĂ y)
                var upcomingInvoiceCount = notificationService.RemindUpcomingInvoices(SystemUserId, daysBefore: 3);
                _logger.LogInformation("DailyReminderService: RemindUpcomingInvoices = {Count} hĂ³a Ä‘Æ¡n", upcomingInvoiceCount);

                // 3. Há»£p Ä‘á»“ng sáº¯p háº¿t háº¡n (7 ngĂ y)
                var upcomingContractCount = notificationService.RemindUpcomingContracts(SystemUserId, daysBefore: 7);
                _logger.LogInformation("DailyReminderService: RemindUpcomingContracts = {Count} há»£p Ä‘á»“ng", upcomingContractCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "DailyReminderService: error during daily reminders");
            }

            await Task.CompletedTask;
        }
    }
}
