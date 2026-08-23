using System.ComponentModel.DataAnnotations;

namespace ShopAPI.DTOs
{
    public class RequestContractDto
    {
        [Required]
        public int RoomId { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Số người ở phải lớn hơn 0.")]
        public int NumberOfOccupants { get; set; } = 1;

        [Required]
        public UpsertTenantProfileDto TenantProfile { get; set; } = new();
    }
}
