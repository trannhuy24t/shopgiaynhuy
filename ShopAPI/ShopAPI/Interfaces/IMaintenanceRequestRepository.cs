using ShopAPI.Models;

namespace ShopAPI.Interfaces
{
    public interface IMaintenanceRequestRepository
    {
        List<MaintenanceRequest> GetAll();

        List<MaintenanceRequest> GetByTenantId(int tenantId);

        MaintenanceRequest? GetById(int id);

        void Add(MaintenanceRequest request);

        void Update(MaintenanceRequest request);
    }
}
