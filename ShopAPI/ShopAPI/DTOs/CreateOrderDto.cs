using System.ComponentModel.DataAnnotations;

namespace ShopAPI.DTOs
{
    public class CreateOrderDto
    {
        [Required]
        public string ReceiverName { get; set; } = string.Empty;

        [Required]
        public string Phone { get; set; } = string.Empty;

        [Required]
        public string Address { get; set; } = string.Empty;

        public string? Note { get; set; }
    }
}