using System.ComponentModel.DataAnnotations;

namespace ShopAPI.DTOs
{
    public class ApproveContractDto
    {
        [Required]
        [Range(0, double.MaxValue, ErrorMessage = "Tiền cọc không được âm.")]
        public decimal Deposit { get; set; }

        [Required]
        [Range(1, double.MaxValue, ErrorMessage = "Tiền thuê hàng tháng phải lớn hơn 0.")]
        public decimal MonthlyRent { get; set; }

        [Range(1, 100, ErrorMessage = "Số người ở phải từ 1 đến 100.")]
        public int NumberOfOccupants { get; set; } = 1;

        [Required]
        [Range(0, double.MaxValue, ErrorMessage = "Đơn giá điện không được âm.")]
        public decimal ElectricUnitPrice { get; set; }

        [Required]
        [Range(0, double.MaxValue, ErrorMessage = "Đơn giá nước không được âm.")]
        public decimal WaterUnitPrice { get; set; }

        public DateTime? EndDate { get; set; }
    }

    public class RejectContractDto
    {
        [MaxLength(500)]
        public string? Reason { get; set; }
    }

    public class SetContractUnitPriceDto
    {
        [Required]
        [Range(0, double.MaxValue, ErrorMessage = "Đơn giá điện không được âm.")]
        public decimal ElectricUnitPrice { get; set; }

        [Required]
        [Range(0, double.MaxValue, ErrorMessage = "Đơn giá nước không được âm.")]
        public decimal WaterUnitPrice { get; set; }
    }
}
