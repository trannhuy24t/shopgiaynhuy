using System.ComponentModel.DataAnnotations;

namespace ShopAPI.DTOs
{
    public class PaymentDto
    {
        public int Id { get; set; }
        public int InvoiceId { get; set; }
        public decimal Amount { get; set; }
        public DateTime PaymentDate { get; set; }
        public string Method { get; set; } = string.Empty;
        public string? TransactionRef { get; set; }
        public string Status { get; set; } = "DaXacNhan";
    }

    public class ConfirmPaymentDto
    {
        [Required]
        public int InvoiceId { get; set; }

        [Required]
        public decimal Amount { get; set; }

        [Required]
        public string Method { get; set; } = "TienMat"; // TienMat | ChuyenKhoan | QR

        public string? TransactionRef { get; set; }
    }

    public class SubmitTransferDto
    {
        [Required]
        public int InvoiceId { get; set; }

        [Required]
        [Range(1, double.MaxValue)]
        public decimal Amount { get; set; }

        [Required]
        [MaxLength(100)]
        public string TransactionRef { get; set; } = string.Empty;
    }

    public class QrPaymentResponseDto
    {
        public int InvoiceId { get; set; }
        public decimal Amount { get; set; }
        public string Payload { get; set; } = string.Empty;
        public bool IsAvailable { get; set; } = true;
        public string? Message { get; set; }
    }
}
