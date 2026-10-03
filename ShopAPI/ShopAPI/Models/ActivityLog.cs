using System.ComponentModel.DataAnnotations;

namespace ShopAPI.Models
{
    public class ActivityLog
    {
        [Key]
        public int Id { get; set; }

        public int? UserId { get; set; }
        public User? User { get; set; }

        [Required]
        [MaxLength(100)]
        public string Action { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string EntityName { get; set; } = string.Empty;

        public int? EntityId { get; set; }

        public string? Detail { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
