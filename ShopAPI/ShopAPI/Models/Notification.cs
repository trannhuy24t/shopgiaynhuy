using System.ComponentModel.DataAnnotations;

namespace ShopAPI.Models
{
    public class Notification
    {
        [Key]
        public int Id { get; set; }

        public int UserId { get; set; }
        public User? User { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        public string Content { get; set; } = string.Empty;

        // NhacNo | HopDong | BaoTri | ThongBaoChung
        public string Type { get; set; } = "ThongBaoChung";

        public bool IsRead { get; set; } = false;

        public int? RelatedInvoiceId { get; set; }
        public Invoice? RelatedInvoice { get; set; }

        public int? RelatedContractId { get; set; }
        public Contract? RelatedContract { get; set; }

        public int? CreatedByUserId { get; set; }
        public User? CreatedByUser { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
