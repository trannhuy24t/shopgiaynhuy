using ShopAPI.DTOs;

namespace ShopAPI.Interfaces
{
    public interface IBuildingService
    {
        List<BuildingDto> GetAll();

        BuildingDto? GetById(int id);

        BuildingDto Create(CreateBuildingDto dto);

        bool Update(UpdateBuildingDto dto);

        bool Delete(int id);
    }
}
