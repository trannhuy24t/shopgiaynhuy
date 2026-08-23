using System.ComponentModel.DataAnnotations;

namespace ShopAPI.Models
{
    public class Occupant
    {
        [Key]
        public int Id { get; set; }

        public int ContractId { get; set; }
        public Contract? Contract { get; set; }

        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? IdCardNumber { get; set; }

        [MaxLength(20)]
        public string? Phone { get; set; }

        // Quan hệ với người thuê chính, ví dụ: "Vợ/chồng", "Con", "Người thân", "Bạn ở cùng"
        [Required]
        [MaxLength(50)]
        public string Relationship { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
