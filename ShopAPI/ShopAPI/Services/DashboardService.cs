using ShopAPI.Data;
using ShopAPI.DTOs;
using ShopAPI.Interfaces;

namespace ShopAPI.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly AppDbContext _context;

        public DashboardService(AppDbContext context)
        {
            _context = context;
        }

        public DashboardDto GetDashboard()
        {
            return new DashboardDto
            {
                TotalProducts = _context.Products.Count(),

                TotalOrders = _context.Orders.Count(),

                TotalUsers = _context.Users.Count(),

                TotalRevenue = _context.Orders
                    .Where(o => o.Status == "Completed")
                    .Sum(o => o.TotalAmount)
            };
        }
    }
}