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

        // Quan há»‡ vá»›i ngÆ°á»i thuĂª chĂ­nh, vĂ­ dá»¥: "Vá»£/chá»“ng", "Con", "NgÆ°á»i thĂ¢n", "Báº¡n á»Ÿ cĂ¹ng"
        [Required]
        [MaxLength(50)]
        public string Relationship { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
