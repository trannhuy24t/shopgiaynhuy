namespace ShopAPI.Interfaces
{
    public interface ITelegramBotService
    {
        Task SendPersonalMessageAsync(string? chatId, string message);
        Task SendGroupMessageAsync(string message);
        Task SendNotificationAsync(string? personalChatId, string message, bool broadcastToGroup = false);
    }
}

