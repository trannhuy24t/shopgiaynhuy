using ShopAPI.Models;

namespace ShopAPI.Interfaces
{
    public interface ITenantRepository
    {
        List<Tenant> GetAll();

        Tenant? GetById(int id);

        Tenant? GetByUserId(int userId);

        void Add(Tenant tenant);

        void Update(Tenant tenant);
    }
}
