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

        // ÄÆ¡n giĂ¡ Ä‘iá»‡n/nÆ°á»›c chá»‘t trong há»£p Ä‘á»“ng â€” hĂ³a Ä‘Æ¡n hĂ ng thĂ¡ng máº·c Ä‘á»‹nh dĂ¹ng Ä‘Ăºng giĂ¡ nĂ y
        // Ä‘á»ƒ tĂ­nh tiá»n Ä‘iá»‡n/nÆ°á»›c (usage x Ä‘Æ¡n giĂ¡), Staff váº«n nháº­p tay Ä‘Æ°á»£c giĂ¡ khĂ¡c náº¿u cáº§n.
        [Column(TypeName = "decimal(18,2)")]
        public decimal ElectricUnitPrice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal WaterUnitPrice { get; set; }

        public ContractStatus Status { get; set; } = ContractStatus.ChoDuyet;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<Invoice> Invoices { get; set; } = new();
        public List<Occupant> Occupants { get; set; } = new();
    }
}
