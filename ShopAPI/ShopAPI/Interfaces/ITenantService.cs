using ShopAPI.DTOs;

namespace ShopAPI.Interfaces
{
    public interface ITenantService
    {
        List<TenantDto> GetAll();

        TenantDto? GetById(int id);

        TenantDto? GetByUserId(int userId);

        // Creates the tenant profile on first use, or updates it otherwise.
        // Reused internally by ContractService when a Tenant registers to rent a room.
        TenantDto UpsertForUser(int userId, UpsertTenantProfileDto dto);
    }
}
