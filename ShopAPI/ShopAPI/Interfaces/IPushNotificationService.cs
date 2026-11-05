using ShopAPI.DTOs;

namespace ShopAPI.Interfaces
{
    public interface IPushNotificationService
    {
        string GetVapidPublicKey();
        Task<PushStatusDto> GetStatusAsync(int userId, string? endpoint = null);
        Task SubscribeAsync(int userId, SubscribePushDto dto);
        Task UnsubscribeAsync(int userId, string endpoint);
        Task<bool> SendTestPushAsync(int userId, string? title = null, string? content = null, string? url = null);
        Task SendPushToUserAsync(int userId, string title, string body, string? url = null);
        Task SendPushToRoleAsync(string role, string title, string body, string? url = null);
        Task SendPushToAllAsync(string title, string body, string? url = null);
    }
}

