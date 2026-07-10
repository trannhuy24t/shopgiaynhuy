using System.ComponentModel.DataAnnotations;

namespace ShopAPI.DTOs
{
    public class UpdateOrderStatusDto
    {
        [Required]
        public int OrderId { get; set; }

        [Required]
        public string Status { get; set; } = string.Empty;
    }
}