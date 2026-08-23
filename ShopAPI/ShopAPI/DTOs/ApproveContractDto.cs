using System.ComponentModel.DataAnnotations;

namespace ShopAPI.DTOs
{
    public class ApproveContractDto
    {
        [Required]
        public decimal Deposit { get; set; }

        [Required]
        public decimal MonthlyRent { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Số người ở phải lớn hơn 0.")]
        public int NumberOfOccupants { get; set; } = 1;

        [Required]
        public decimal ElectricUnitPrice { get; set; }

        [Required]
        public decimal WaterUnitPrice { get; set; }

        public DateTime? EndDate { get; set; }
    }

    public class RejectContractDto
    {
        public string? Reason { get; set; }
    }
}
