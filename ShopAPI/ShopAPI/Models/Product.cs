using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace ShopAPI.Models
{
    public class Product
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        public int Quantity { get; set; }

        public string? ImageUrl { get; set; }
        public int? CategoryId { get; set; }

        public Category? Category { get; set; }

        public bool IsActive { get; set; } = true;
        public List<ProductSize> ProductSizes { get; set; } = new();

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}