using ShopAPI.Data;
using ShopAPI.Interfaces;
using Microsoft.EntityFrameworkCore;
using ShopAPI.Models;

namespace ShopAPI.Repositories
{
    public class BuildingRepository : IBuildingRepository
    {
        private readonly AppDbContext _context;

        public BuildingRepository(AppDbContext context)
        {
            _context = context;
        }

        public List<Building> GetAll()
        {
            return _context.Buildings
                .Include(x => x.Owner)
                .Include(x => x.Rooms)
                .ToList();
        }

        public Building? GetById(int id)
        {
            return _context.Buildings
                .Include(x => x.Owner)
                .Include(x => x.Rooms)
                .FirstOrDefault(x => x.Id == id);
        }

        public void Add(Building building)
        {
            _context.Buildings.Add(building);
            _context.SaveChanges();
        }

        public void Update(Building building)
        {
            _context.Buildings.Update(building);
            _context.SaveChanges();
        }

        public void Delete(Building building)
        {
            _context.Buildings.Remove(building);
            _context.SaveChanges();
        }
    }
}
