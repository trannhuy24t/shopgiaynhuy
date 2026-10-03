using System.ComponentModel.DataAnnotations;

namespace ShopAPI.DTOs
{
    public class CreateInvoiceDto
    {
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "ContractId không hợp lệ.")]
        public int ContractId { get; set; }

        [Required]
        [Range(1, 12, ErrorMessage = "Tháng phải từ 1 đến 12.")]
        public int Month { get; set; }

        [Required]
        [Range(2020, 2100, ErrorMessage = "Năm không hợp lệ.")]
        public int Year { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Số điện cũ không được âm.")]
        public int ElectricOldReading { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Số điện mới không được âm.")]
        public int ElectricNewReading { get; set; }

        // Bỏ trống thì lấy đơn giá đã chốt trong hợp đồng (Contract.ElectricUnitPrice)
        [Range(0, double.MaxValue, ErrorMessage = "Đơn giá điện không được âm.")]
        public decimal? ElectricUnitPrice { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Số nước cũ không được âm.")]
        public int WaterOldReading { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Số nước mới không được âm.")]
        public int WaterNewReading { get; set; }

        // Bỏ trống thì lấy đơn giá đã chốt trong hợp đồng (Contract.WaterUnitPrice)
        [Range(0, double.MaxValue, ErrorMessage = "Đơn giá nước không được âm.")]
        public decimal? WaterUnitPrice { get; set; }

        // Bỏ trống thì lấy mặc định từ ServiceFee cấu hình trên phòng (Room.ServiceFee)
        [Range(0, double.MaxValue, ErrorMessage = "Phí dịch vụ không được âm.")]
        public decimal? ServiceFee { get; set; }

        [Required]
        public DateTime DueDate { get; set; }
    }
}
