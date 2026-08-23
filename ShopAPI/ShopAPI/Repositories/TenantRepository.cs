using ShopAPI.Data;
using ShopAPI.Interfaces;
using Microsoft.EntityFrameworkCore;
using ShopAPI.Models;

namespace ShopAPI.Repositories
{
    public class TenantRepository : ITenantRepository
    {
        private readonly AppDbContext _context;

        public TenantRepository(AppDbContext context)
        {
            _context = context;
        }

        public List<Tenant> GetAll()
        {
            return _context.Tenants
                .Include(x => x.User)
                .ToList();
        }

        public Tenant? GetById(int id)
        {
            return _context.Tenants
                .Include(x => x.User)
                .FirstOrDefault(x => x.Id == id);
        }

        public Tenant? GetByUserId(int userId)
        {
            return _context.Tenants
                .Include(x => x.User)
                .FirstOrDefault(x => x.UserId == userId);
        }

        public void Add(Tenant tenant)
        {
            _context.Tenants.Add(tenant);
            _context.SaveChanges();
        }

        public void Update(Tenant tenant)
        {
            _context.Tenants.Update(tenant);
            _context.SaveChanges();
        }
    }
}
