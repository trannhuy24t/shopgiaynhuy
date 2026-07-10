using System.ComponentModel.DataAnnotations;

namespace ShopAPI.DTOs
{
    public class AddToCartDto
    {
        [Required]
        public int ProductId { get; set; }

        [Required]
        public int Quantity { get; set; }
    }
}