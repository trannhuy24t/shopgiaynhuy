using System.ComponentModel.DataAnnotations;

namespace ShopAPI.Models
{
    public class MaintenanceRequest
    {
        [Key]
        public int Id { get; set; }

        public int RoomId { get; set; }
        public Room? Room { get; set; }

        public int TenantId { get; set; }
        public Tenant? Tenant { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }
        public string? ImageUrl { get; set; }

        // Thap | TrungBinh | Cao
        public string Priority { get; set; } = "TrungBinh";

        // Moi | DaPhanCong | DangXuLy | HoanThanh | DaHuy
        public string Status { get; set; } = "Moi";

        public int? AssignedToUserId { get; set; }
        public User? AssignedToUser { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? ResolvedAt { get; set; }

        public string? Note { get; set; }
    }
}
