using ShopAPI.Models;

namespace ShopAPI.Interfaces
{
    public interface IContractRepository
    {
        List<Contract> GetAll();

        List<Contract> GetByTenantId(int tenantId);

        Contract? GetById(int id);

        Contract? GetActiveByRoomId(int roomId);

        void Add(Contract contract);

        void Update(Contract contract);

        Occupant? GetOccupantById(int occupantId);

        void AddOccupant(Occupant occupant);

        void UpdateOccupant(Occupant occupant);

        void RemoveOccupant(Occupant occupant);
    }
}
