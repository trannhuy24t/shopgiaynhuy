using System.ComponentModel.DataAnnotations;

namespace ShopAPI.DTOs
{
    public class UpdateProductDto
    {
        [Required]
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }
        public int? CategoryId { get; set; }

        [Required]
        public decimal Price { get; set; }

        public int Quantity { get; set; }

        public string? ImageUrl { get; set; }

        public bool IsActive { get; set; }
    }
}