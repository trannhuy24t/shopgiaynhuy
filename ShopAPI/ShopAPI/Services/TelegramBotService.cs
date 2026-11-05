using System.Text;
using System.Text.Json;
using ShopAPI.Interfaces;

namespace ShopAPI.Services
{
    public class TelegramBotService : ITelegramBotService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<TelegramBotService> _logger;
        private readonly string _botToken;
        private readonly string _groupChatId;
        private readonly bool _enabled;

        public TelegramBotService(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<TelegramBotService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;

            _botToken = _configuration["Telegram:BotToken"]?.Trim() ?? "";
            _groupChatId = _configuration["Telegram:GroupChatId"]?.Trim() ?? "";
            _enabled = _configuration.GetValue<bool>("Telegram:Enabled", false);
        }

        public async Task SendPersonalMessageAsync(string? chatId, string message)
        {
            if (string.IsNullOrWhiteSpace(chatId)) return;
            await SendRawMessageAsync(chatId.Trim(), message);
        }

        public async Task SendGroupMessageAsync(string message)
        {
            if (string.IsNullOrWhiteSpace(_groupChatId))
            {
                _logger.LogDebug("Telegram GroupChatId chưa được cấu hình, bỏ qua gửi nhóm.");
                return;
            }
            await SendRawMessageAsync(_groupChatId, message);
        }

        public async Task SendNotificationAsync(string? personalChatId, string message, bool broadcastToGroup = false)
        {
            if (!string.IsNullOrWhiteSpace(personalChatId))
            {
                await SendPersonalMessageAsync(personalChatId, message);
            }

            if (broadcastToGroup)
            {
                await SendGroupMessageAsync(message);
            }
        }

        private async Task SendRawMessageAsync(string targetChatId, string message)
        {
            if (!_enabled)
            {
                _logger.LogDebug("Telegram Bot đang bị tắt (Enabled=false), bỏ qua gửi tin.");
                return;
            }

            if (string.IsNullOrWhiteSpace(_botToken))
            {
                _logger.LogWarning("Telegram BotToken chưa được thiết lập trong appsettings.json.");
                return;
            }

            try
            {
                var url = $"https://api.telegram.org/bot{_botToken}/sendMessage";
                var payload = new
                {
                    chat_id = targetChatId,
                    text = message,
                    parse_mode = "HTML"
                };

                var content = new StringContent(
                    JsonSerializer.Serialize(payload),
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await _httpClient.PostAsync(url, content);
                if (!response.IsSuccessStatusCode)
                {
                    var responseBody = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning("Telegram API trả về lỗi ({StatusCode}) khi gửi tới chatId {ChatId}: {Response}",
                        response.StatusCode, targetChatId, responseBody);
                }
                else
                {
                    _logger.LogInformation("Đã gửi tin nhắn Telegram thành công tới chatId: {ChatId}", targetChatId);
                }
            }
            catch (Exception ex)
            {
                // Fault tolerance: Không bao giờ throw ra ngoài làm gián đoạn luồng nghiệp vụ
                _logger.LogError(ex, "Lỗi kết nối khi gửi tin nhắn Telegram tới chatId: {ChatId}", targetChatId);
            }
        }
    }
}

