using System.ComponentModel.DataAnnotations;

namespace ShopAPI.DTOs
{
    public class CreateInvoiceDto
    {
        [Required]
        public int ContractId { get; set; }

        [Required]
        public int Month { get; set; }

        [Required]
        public int Year { get; set; }

        public int ElectricOldReading { get; set; }
        public int ElectricNewReading { get; set; }

        // Bỏ trống thì lấy đơn giá đã chốt trong hợp đồng (Contract.ElectricUnitPrice)
        public decimal? ElectricUnitPrice { get; set; }

        public int WaterOldReading { get; set; }
        public int WaterNewReading { get; set; }

        // Bỏ trống thì lấy đơn giá đã chốt trong hợp đồng (Contract.WaterUnitPrice)
        public decimal? WaterUnitPrice { get; set; }

        // Bỏ trống thì lấy mặc định từ ServiceFee cấu hình trên phòng (Room.ServiceFee)
        public decimal? ServiceFee { get; set; }

        [Required]
        public DateTime DueDate { get; set; }
    }
}
