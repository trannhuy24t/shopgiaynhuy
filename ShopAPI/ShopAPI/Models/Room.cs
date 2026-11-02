using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShopAPI.Models
{
    public class Room
    {
        [Key]
        public int Id { get; set; }

        public int BuildingId { get; set; }
        public Building? Building { get; set; }

        [Required]
        [MaxLength(20)]
        public string RoomNumber { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? RoomType { get; set; } // Phòng đơn, Phòng gác xép, Phòng 2 ngủ 1 khách, Studio, Duplex...

        [Column(TypeName = "decimal(10,2)")]
        public decimal Area { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        // Phí dịch vụ tính theo đầu người/tháng (internet, rác, gửi xe...).
        // Khi tạo hóa đơn: Tiền dịch vụ = ServiceFee x số người đang ở thực tế của hợp đồng.
        [Column(TypeName = "decimal(18,2)")]
        public decimal ServiceFee { get; set; }

        public RoomStatus Status { get; set; } = RoomStatus.Trong;

        // Danh sách đồ đạc / tiện nghi trong phòng (ví dụ: "Điều hòa, Nóng lạnh, Tủ lạnh, Giường nệm, Tủ quần áo, Kệ bếp...")
        [MaxLength(1000)]
        public string? Amenities { get; set; }

        public string? Description { get; set; }
        public string? ImageUrl { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<Contract> Contracts { get; set; } = new();
        public List<MaintenanceRequest> MaintenanceRequests { get; set; } = new();
        public List<RoomMedia> Media { get; set; } = new();
    }
}
