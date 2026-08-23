using System.ComponentModel.DataAnnotations;

namespace ShopAPI.DTOs
{
    public class SystemConfigDto
    {
        public int Id { get; set; }
        public string Key { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class UpsertSystemConfigDto
    {
        [Required]
        public string Key { get; set; } = string.Empty;

        [Required]
        public string Value { get; set; } = string.Empty;

        public string? Description { get; set; }
    }

    // Chỉ lộ ra 2 đơn giá tham khảo (không phải toàn bộ SystemConfig, tránh lộ thông tin tài
    // khoản ngân hàng) — dùng cho khách xem phòng/đăng ký thuê khi chưa có hợp đồng để chốt giá thật.
    public class PublicRatesDto
    {
        public decimal ElectricUnitPrice { get; set; }
        public decimal WaterUnitPrice { get; set; }
    }
}
