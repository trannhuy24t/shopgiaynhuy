using ShopAPI.Models;

namespace ShopAPI.Interfaces
{
    public interface IBuildingRepository
    {
        List<Building> GetAll();

        Building? GetById(int id);

        void Add(Building building);

        void Update(Building building);

        void Delete(Building building);
    }
}
