using System.Threading.Tasks;

namespace ShopAPI.Interfaces
{
    public interface IZaloService
    {
        Task<bool> SendMaintenanceToLandlordAsync(
            string? landlordPhone,
            string? landlordName,
            string roomNumber,
            string? buildingName,
            string tenantName,
            string? tenantPhone,
            string title,
            string? description,
            string priority);

        Task<bool> SendAssignmentToStaffAsync(
            string? staffPhone,
            string? staffName,
            string roomNumber,
            string? buildingName,
            string? buildingAddress,
            string tenantName,
            string? tenantPhone,
            string title,
            string? description,
            string priority,
            string? note);
    }
}

