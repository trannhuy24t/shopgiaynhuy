using System.ComponentModel.DataAnnotations;

namespace ShopAPI.Models
{
    public class Building
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(300)]
        public string Address { get; set; } = string.Empty;

        public int OwnerId { get; set; }
        public User? Owner { get; set; }

        public string? Description { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<Room> Rooms { get; set; } = new();
    }
}
