using System.ComponentModel.DataAnnotations;

namespace ShopAPI.DTOs
{
    public class PushSubscriptionKeysDto
    {
        public string P256dh { get; set; } = string.Empty;
        public string Auth { get; set; } = string.Empty;
    }

    public class SubscribePushDto
    {
        [Required]
        public string Endpoint { get; set; } = string.Empty;

        public PushSubscriptionKeysDto? Keys { get; set; }

        public string? P256dh { get; set; }
        public string? Auth { get; set; }
        public string? DeviceDescription { get; set; }
    }

    public class UnsubscribePushDto
    {
        [Required]
        public string Endpoint { get; set; } = string.Empty;
    }

    public class SendPushTestDto
    {
        public string? Title { get; set; }
        public string? Content { get; set; }
        public string? Url { get; set; }
    }

    public class PushStatusDto
    {
        public bool IsSupported { get; set; } = true;
        public string VapidPublicKey { get; set; } = string.Empty;
        public int SubscribedDevicesCount { get; set; }
        public bool IsDeviceSubscribed { get; set; }
    }
}

