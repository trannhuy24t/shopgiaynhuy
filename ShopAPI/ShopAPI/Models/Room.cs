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

        [Column(TypeName = "decimal(10,2)")]
        public decimal Area { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        // Phí dịch vụ tính theo đầu người/tháng (internet, rác, gửi xe...).
        // Khi tạo hóa đơn: Tiền dịch vụ = ServiceFee x số người đang ở thực tế của hợp đồng.
        [Column(TypeName = "decimal(18,2)")]
        public decimal ServiceFee { get; set; }

        // Trong | DaThue | DangSua
        public string Status { get; set; } = "Trong";

        public string? Description { get; set; }
        public string? ImageUrl { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public List<Contract> Contracts { get; set; } = new();
        public List<MaintenanceRequest> MaintenanceRequests { get; set; } = new();
        public List<RoomMedia> Media { get; set; } = new();
    }
}
