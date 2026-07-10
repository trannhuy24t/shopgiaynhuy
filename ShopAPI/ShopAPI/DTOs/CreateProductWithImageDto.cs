using System.ComponentModel.DataAnnotations;

namespace ShopAPI.DTOs
{
    public class CreateProductWithImageDto
    {
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Required]
        public decimal Price { get; set; }

        public int Quantity { get; set; }

        public int? CategoryId { get; set; }

        public IFormFile? Image { get; set; }
    }
}