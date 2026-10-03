using System.ComponentModel.DataAnnotations;
using ShopAPI.Models;

namespace ShopAPI.DTOs
{
    public class CreateMaintenanceRequestDto
    {
        [Required]
        public int RoomId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }
        public string? ImageUrl { get; set; }

        public string Priority { get; set; } = nameof(MaintenancePriority.TrungBinh);
    }

    public class CreateMaintenanceRequestWithImageDto
    {
        [Required]
        public int RoomId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string Priority { get; set; } = nameof(MaintenancePriority.TrungBinh);

        public IFormFile? Image { get; set; }
    }

    public class AssignMaintenanceDto
    {
        [Required]
        public int AssignedToUserId { get; set; }
    }

    public class UpdateMaintenanceStatusDto : IValidatableObject
    {
        [Required]
        public string Status { get; set; } = string.Empty;

        public string? Note { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (!Enum.TryParse<MaintenanceStatus>(Status, out _))
                yield return new ValidationResult(
                    $"Trạng thái không hợp lệ. Các giá trị hợp lệ: {string.Join(", ", Enum.GetNames<MaintenanceStatus>())}",
                    [nameof(Status)]);
        }
    }
}
