using System.ComponentModel.DataAnnotations;

namespace ShopAPI.DTOs
{
    public class CreateRoomDto
    {
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "BuildingId không hợp lệ.")]
        public int BuildingId { get; set; }

        [Required]
        [MaxLength(20, ErrorMessage = "Số phòng không quá 20 ký tự.")]
        public string RoomNumber { get; set; } = string.Empty;

        [Range(0, 10000, ErrorMessage = "Diện tích phải từ 0 đến 10000 m².")]
        public decimal Area { get; set; }

        [Required]
        [Range(0, double.MaxValue, ErrorMessage = "Giá phòng không được âm.")]
        public decimal Price { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Phí dịch vụ không được âm.")]
        public decimal ServiceFee { get; set; }

        [MaxLength(1000)]
        public string? Description { get; set; }

        [MaxLength(500)]
        public string? ImageUrl { get; set; }
    }
}
