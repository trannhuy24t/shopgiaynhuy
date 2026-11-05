using System.ComponentModel.DataAnnotations;

namespace ShopAPI.DTOs
{
    public class UpdateProfileDto
    {
        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? PhoneNumber { get; set; }

        [MaxLength(50)]
        public string? TelegramChatId { get; set; }
    }
}
