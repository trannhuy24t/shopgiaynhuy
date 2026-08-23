using System.ComponentModel.DataAnnotations;

namespace ShopAPI.DTOs
{
    public class CreateMaintenanceRequestDto
    {
        [Required]
        public int RoomId { get; set; }

        [Required]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }
        public string? ImageUrl { get; set; }

        public string Priority { get; set; } = "TrungBinh"; // Thap | TrungBinh | Cao
    }

    public class CreateMaintenanceRequestWithImageDto
    {
        [Required]
        public int RoomId { get; set; }

        [Required]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string Priority { get; set; } = "TrungBinh";

        public IFormFile? Image { get; set; }
    }

    public class AssignMaintenanceDto
    {
        [Required]
        public int AssignedToUserId { get; set; }
    }

    public class UpdateMaintenanceStatusDto
    {
        [Required]
        public string Status { get; set; } = string.Empty; // DangXuLy | HoanThanh | DaHuy
        public string? Note { get; set; }
    }
}
