using System.ComponentModel.DataAnnotations;

namespace ShopAPI.DTOs
{
    public class UpdateCartItemDto
    {
        [Required]
        public int CartItemId { get; set; }

        [Required]
        public int Quantity { get; set; }
    }
}