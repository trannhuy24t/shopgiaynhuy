using System.ComponentModel.DataAnnotations;

namespace ShopAPI.DTOs
{
    public class UpdateBuildingDto
    {
        [Required]
        public int Id { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Address { get; set; } = string.Empty;

        [Required]
        public int OwnerId { get; set; }

        public string? Description { get; set; }
    }
}
