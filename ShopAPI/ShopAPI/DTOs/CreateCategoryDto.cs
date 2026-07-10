using System.ComponentModel.DataAnnotations;

namespace ShopAPI.DTOs
{
    public class CreateCategoryDto
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
    }
}