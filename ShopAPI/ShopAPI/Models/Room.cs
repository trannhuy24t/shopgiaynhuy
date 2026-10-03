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

        // PhĂ­ dá»‹ch vá»¥ tĂ­nh theo Ä‘áº§u ngÆ°á»i/thĂ¡ng (internet, rĂ¡c, gá»­i xe...).
        // Khi táº¡o hĂ³a Ä‘Æ¡n: Tiá»n dá»‹ch vá»¥ = ServiceFee x sá»‘ ngÆ°á»i Ä‘ang á»Ÿ thá»±c táº¿ cá»§a há»£p Ä‘á»“ng.
        [Column(TypeName = "decimal(18,2)")]
        public decimal ServiceFee { get; set; }

        public RoomStatus Status { get; set; } = RoomStatus.Trong;

        public string? Description { get; set; }
        public string? ImageUrl { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<Contract> Contracts { get; set; } = new();
        public List<MaintenanceRequest> MaintenanceRequests { get; set; } = new();
        public List<RoomMedia> Media { get; set; } = new();
    }
}
