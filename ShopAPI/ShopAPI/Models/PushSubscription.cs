using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShopAPI.Models
{
    [Table("PushSubscriptions")]
    public class PushSubscription
    {
        [Key]
        public int Id { get; set; }

        public int UserId { get; set; }
        public User? User { get; set; }

        [Required]
        [MaxLength(1000)]
        public string Endpoint { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string P256dh { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string Auth { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? DeviceDescription { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}

