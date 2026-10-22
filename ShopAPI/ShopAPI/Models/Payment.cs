using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShopAPI.Models
{
    public class Payment
    {
        [Key]
        public int Id { get; set; }

        public int InvoiceId { get; set; }
        public Invoice? Invoice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

        // TienMat | ChuyenKhoan | QR
        public string Method { get; set; } = "TienMat";

        [MaxLength(20)]
        public string Status { get; set; } = "DaXacNhan"; // ChoXacNhan | DaXacNhan | TuChoi

        [MaxLength(100)]
        public string? TransactionRef { get; set; }
    }
}
