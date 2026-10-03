using System.ComponentModel.DataAnnotations;

namespace ShopAPI.Models
{
    public class Tenant
    {
        [Key]
        public int Id { get; set; }

        public int UserId { get; set; }
        public User? User { get; set; }

        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? IdCardNumber { get; set; }

        [MaxLength(20)]
        public string? Phone { get; set; }

        [MaxLength(100)]
        public string? Email { get; set; }

        [MaxLength(20)]
        public string? EmergencyContact { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<Contract> Contracts { get; set; } = new();
        public List<MaintenanceRequest> MaintenanceRequests { get; set; } = new();
    }
}
