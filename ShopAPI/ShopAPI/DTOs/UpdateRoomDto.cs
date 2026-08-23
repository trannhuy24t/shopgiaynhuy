using System.ComponentModel.DataAnnotations;

namespace ShopAPI.DTOs
{
    public class UpdateRoomDto
    {
        [Required]
        public int Id { get; set; }

        [Required]
        public string RoomNumber { get; set; } = string.Empty;

        public decimal Area { get; set; }

        [Required]
        public decimal Price { get; set; }

        public decimal ServiceFee { get; set; }

        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
    }

    public class UpdateRoomStatusDto
    {
        [Required]
        public int Id { get; set; }

        [Required]
        public string Status { get; set; } = string.Empty; // Trong | DaThue | DangSua
    }

    public class CreateRoomWithImageDto
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

        public IFormFile? Image { get; set; }
    }

    public class UpdateRoomWithImageDto
    {
        [Required]
        public string RoomNumber { get; set; } = string.Empty;

        public decimal Area { get; set; }

        [Required]
        public decimal Price { get; set; }

        public decimal ServiceFee { get; set; }

        public string? Description { get; set; }

        // Bỏ trống nếu không muốn đổi ảnh — giữ nguyên ảnh cũ
        public IFormFile? Image { get; set; }
    }
}
