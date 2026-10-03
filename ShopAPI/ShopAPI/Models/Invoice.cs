using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShopAPI.Models
{
    public class Invoice
    {
        [Key]
        public int Id { get; set; }

        public int ContractId { get; set; }
        public Contract? Contract { get; set; }

        public int Month { get; set; }
        public int Year { get; set; }

        public int ElectricOldReading { get; set; }
        public int ElectricNewReading { get; set; }
        public int ElectricUsage { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal ElectricUnitPrice { get; set; }

        public int WaterOldReading { get; set; }
        public int WaterNewReading { get; set; }
        public int WaterUsage { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal WaterUnitPrice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        public InvoiceType Type { get; set; } = InvoiceType.HangThang;

        public InvoiceStatus Status { get; set; } = InvoiceStatus.ChuaThanhToan;

        public DateTime DueDate { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<InvoiceItem> Items { get; set; } = new();
        public List<Payment> Payments { get; set; } = new();
    }
}
