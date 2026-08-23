using ShopAPI.Data;
using ShopAPI.Interfaces;
using Microsoft.EntityFrameworkCore;
using ShopAPI.Models;

namespace ShopAPI.Repositories
{
    public class ContractRepository : IContractRepository
    {
        private readonly AppDbContext _context;

        public ContractRepository(AppDbContext context)
        {
            _context = context;
        }

        private IQueryable<Contract> Query()
        {
            return _context.Contracts
                .Include(x => x.Room)
                .Include(x => x.Tenant)
                .Include(x => x.Occupants);
        }

        public List<Contract> GetAll()
        {
            return Query().ToList();
        }

        public List<Contract> GetByTenantId(int tenantId)
        {
            return Query().Where(x => x.TenantId == tenantId).ToList();
        }

        public Contract? GetById(int id)
        {
            return Query().FirstOrDefault(x => x.Id == id);
        }

        public Contract? GetActiveByRoomId(int roomId)
        {
            return Query().FirstOrDefault(x => x.RoomId == roomId && x.Status == "DangHieuLuc");
        }

        public void Add(Contract contract)
        {
            _context.Contracts.Add(contract);
            _context.SaveChanges();
        }

        public void Update(Contract contract)
        {
            _context.Contracts.Update(contract);
            _context.SaveChanges();
        }

        public Occupant? GetOccupantById(int occupantId)
        {
            return _context.Occupants.FirstOrDefault(x => x.Id == occupantId);
        }

        public void AddOccupant(Occupant occupant)
        {
            _context.Occupants.Add(occupant);
            _context.SaveChanges();
        }

        public void UpdateOccupant(Occupant occupant)
        {
            _context.Occupants.Update(occupant);
            _context.SaveChanges();
        }

        public void RemoveOccupant(Occupant occupant)
        {
            _context.Occupants.Remove(occupant);
            _context.SaveChanges();
        }
    }
}
