using System.ComponentModel.DataAnnotations;

namespace ShopAPI.DTOs
{
    public class UpsertTenantProfileDto
    {
        [Required]
        public string FullName { get; set; } = string.Empty;

        public string? IdCardNumber { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? EmergencyContact { get; set; }
    }
}
