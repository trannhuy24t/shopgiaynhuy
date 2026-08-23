using System.ComponentModel.DataAnnotations;

namespace ShopAPI.Models
{
    public class SystemConfig
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Key { get; set; } = string.Empty;

        public string Value { get; set; } = string.Empty;

        public string? Description { get; set; }
    }
}
