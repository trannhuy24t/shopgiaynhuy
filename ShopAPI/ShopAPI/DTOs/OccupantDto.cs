using System.ComponentModel.DataAnnotations;

namespace ShopAPI.DTOs
{
    public class OccupantDto
    {
        public int Id { get; set; }
        public int ContractId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Relationship { get; set; } = string.Empty;
        public string? IdCardNumber { get; set; }
        public string? Phone { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateOccupantDto
    {
        [Required]
        public string FullName { get; set; } = string.Empty;

        [Required]
        public string Relationship { get; set; } = string.Empty;

        public string? IdCardNumber { get; set; }
        public string? Phone { get; set; }
    }

    public class UpdateOccupantDto
    {
        [Required]
        public string FullName { get; set; } = string.Empty;

        [Required]
        public string Relationship { get; set; } = string.Empty;

        public string? IdCardNumber { get; set; }
        public string? Phone { get; set; }
    }
}
