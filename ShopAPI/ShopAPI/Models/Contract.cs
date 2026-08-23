using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShopAPI.Models
{
    public class Contract
    {
        [Key]
        public int Id { get; set; }

        public int RoomId { get; set; }
        public Room? Room { get; set; }

        public int TenantId { get; set; }
        public Tenant? Tenant { get; set; }

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Deposit { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal MonthlyRent { get; set; }

        public int NumberOfOccupants { get; set; } = 1;

        // Đơn giá điện/nước chốt trong hợp đồng — hóa đơn hàng tháng mặc định dùng đúng giá này
        // để tính tiền điện/nước (usage x đơn giá), Staff vẫn nhập tay được giá khác nếu cần.
        [Column(TypeName = "decimal(18,2)")]
        public decimal ElectricUnitPrice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal WaterUnitPrice { get; set; }

        // ChoDuyet | TuChoi | ChoCoc | DangHieuLuc | DaKetThuc
        public string Status { get; set; } = "ChoDuyet";

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public List<Invoice> Invoices { get; set; } = new();
        public List<Occupant> Occupants { get; set; } = new();
    }
}
