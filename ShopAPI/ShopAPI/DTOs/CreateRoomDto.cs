using System.ComponentModel.DataAnnotations;

namespace ShopAPI.DTOs
{
    public class CreateRoomDto
    {
        [Required]
        public int BuildingId { get; set; }

        [Required]
        public string RoomNumber { get; set; } = string.Empty;

        public decimal Area { get; set; }

        [Required]
        public decimal Price { get; set; }

        public decimal ServiceFee { get; set; }

        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
    }
}
