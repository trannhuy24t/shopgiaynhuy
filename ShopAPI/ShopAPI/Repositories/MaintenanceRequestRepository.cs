using ShopAPI.Data;
using ShopAPI.Interfaces;
using Microsoft.EntityFrameworkCore;
using ShopAPI.Models;

namespace ShopAPI.Repositories
{
    public class MaintenanceRequestRepository : IMaintenanceRequestRepository
    {
        private readonly AppDbContext _context;

        public MaintenanceRequestRepository(AppDbContext context)
        {
            _context = context;
        }

        private IQueryable<MaintenanceRequest> Query()
        {
            return _context.MaintenanceRequests
                .Include(x => x.Room)
                .Include(x => x.Tenant)
                .Include(x => x.AssignedToUser);
        }

        public List<MaintenanceRequest> GetAll()
        {
            return Query().OrderByDescending(x => x.Id).ToList();
        }

        public List<MaintenanceRequest> GetByTenantId(int tenantId)
        {
            return Query().Where(x => x.TenantId == tenantId).OrderByDescending(x => x.Id).ToList();
        }

        public MaintenanceRequest? GetById(int id)
        {
            return Query().FirstOrDefault(x => x.Id == id);
        }

        public void Add(MaintenanceRequest request)
        {
            _context.MaintenanceRequests.Add(request);
            _context.SaveChanges();
        }

        public void Update(MaintenanceRequest request)
        {
            _context.MaintenanceRequests.Update(request);
            _context.SaveChanges();
        }
    }
}
