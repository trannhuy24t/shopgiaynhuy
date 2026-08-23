using ShopAPI.DTOs;

namespace ShopAPI.Interfaces
{
    public interface ISystemConfigService
    {
        List<SystemConfigDto> GetAll();

        SystemConfigDto Upsert(UpsertSystemConfigDto dto);

        // Công khai, không cần đăng nhập — chỉ 2 đơn giá tham khảo, không lộ config khác.
        PublicRatesDto GetPublicRates();
    }
}
