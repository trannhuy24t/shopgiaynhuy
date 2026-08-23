using ShopAPI.DTOs;

namespace ShopAPI.Interfaces
{
    public interface IMaintenanceRequestService
    {
        List<MaintenanceRequestDto> GetAll(string? status);

        List<MaintenanceRequestDto> GetMy(int userId);

        MaintenanceRequestDto? GetById(int id);

        bool IsOwnedByUser(int requestId, int userId);

        MaintenanceRequestDto? Create(int userId, CreateMaintenanceRequestDto dto);

        bool Assign(int id, AssignMaintenanceDto dto, int actorUserId);

        bool UpdateStatus(int id, UpdateMaintenanceStatusDto dto, int actorUserId);
    }
}
