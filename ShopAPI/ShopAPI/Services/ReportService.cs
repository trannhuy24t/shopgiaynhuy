using Microsoft.EntityFrameworkCore;
using ShopAPI.Data;
using ShopAPI.DTOs;
using ShopAPI.Interfaces;

namespace ShopAPI.Services
{
    public class ReportService : IReportService
    {
        private readonly AppDbContext _context;

        public ReportService(AppDbContext context)
        {
            _context = context;
        }

        public ReportDashboardDto GetDashboard()
        {
            var totalRooms = _context.Rooms.Count();
            var occupiedRooms = _context.Rooms.Count(r => r.Status == "DaThue");
            var vacantRooms = _context.Rooms.Count(r => r.Status == "Trong");
            var maintenanceRooms = _context.Rooms.Count(r => r.Status == "DangSua");

            var now = DateTime.Now;
            var rangeStart = new DateTime(now.Year, now.Month, 1).AddMonths(-5);

            var recentPayments = _context.Payments
                .Where(p => p.PaymentDate >= rangeStart)
                .Select(p => new { p.PaymentDate, p.Amount })
                .ToList();

            var revenueByMonth = new List<MonthlyRevenueDto>();

            for (var i = 5; i >= 0; i--)
            {
                var bucket = new DateTime(now.Year, now.Month, 1).AddMonths(-i);

                var total = recentPayments
                    .Where(p => p.PaymentDate.Year == bucket.Year && p.PaymentDate.Month == bucket.Month)
                    .Sum(p => p.Amount);

                revenueByMonth.Add(new MonthlyRevenueDto { Month = bucket.Month, Year = bucket.Year, Total = total });
            }

            var overdueInvoices = _context.Invoices.Where(i => i.Status == "QuaHan").ToList();

            return new ReportDashboardDto
            {
                TotalRooms = totalRooms,
                OccupiedRooms = occupiedRooms,
                VacantRooms = vacantRooms,
                MaintenanceRooms = maintenanceRooms,
                OccupancyRate = totalRooms == 0 ? 0 : Math.Round(occupiedRooms * 100m / totalRooms, 2),

                TotalTenants = _context.Tenants.Count(),

                TotalRevenueThisMonth = revenueByMonth.Last().Total,
                RevenueByMonth = revenueByMonth,

                OverdueInvoiceCount = overdueInvoices.Count,
                OverdueAmount = overdueInvoices.Sum(i => i.TotalAmount),

                PendingContracts = _context.Contracts.Count(c => c.Status == "ChoDuyet"),
                PendingMaintenanceRequests = _context.MaintenanceRequests.Count(m => m.Status == "Moi" || m.Status == "DaPhanCong")
            };
        }

        public PagedResultDto<ActivityLogDto> GetLogs(int page, int pageSize)
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 20;

            var query = _context.ActivityLogs
                .Include(x => x.User)
                .OrderByDescending(x => x.Id);

            var totalItems = query.Count();

            var items = query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new ActivityLogDto
                {
                    Id = x.Id,
                    UserId = x.UserId,
                    UserName = x.User != null ? x.User.FullName : null,
                    Action = x.Action,
                    EntityName = x.EntityName,
                    EntityId = x.EntityId,
                    Detail = x.Detail,
                    CreatedAt = x.CreatedAt
                })
                .ToList();

            return new PagedResultDto<ActivityLogDto>
            {
                TotalItems = totalItems,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize),
                Items = items
            };
        }
    }
}
