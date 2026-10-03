using Microsoft.EntityFrameworkCore;
using ShopAPI.Data;
using ShopAPI.DTOs;
using ShopAPI.Interfaces;
using ShopAPI.Models;

namespace ShopAPI.Services
{
    public class ReportService : IReportService
    {
        private readonly AppDbContext _context;

        public ReportService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ReportDashboardDto> GetDashboardAsync()
        {
            var totalRooms = await _context.Rooms.CountAsync();
            var occupiedRooms = await _context.Rooms.CountAsync(r => r.Status == RoomStatus.DaThue);
            var vacantRooms = await _context.Rooms.CountAsync(r => r.Status == RoomStatus.Trong);
            var maintenanceRooms = await _context.Rooms.CountAsync(r => r.Status == RoomStatus.DangSua);

            var now = DateTime.UtcNow;
            var rangeStart = new DateTime(now.Year, now.Month, 1).AddMonths(-5);

            var recentPayments = await _context.Payments
                .Where(p => p.PaymentDate >= rangeStart)
                .Select(p => new { p.PaymentDate, p.Amount })
                .ToListAsync();

            var revenueByMonth = new List<MonthlyRevenueDto>();

            for (var i = 5; i >= 0; i--)
            {
                var bucket = new DateTime(now.Year, now.Month, 1).AddMonths(-i);

                var total = recentPayments
                    .Where(p => p.PaymentDate.Year == bucket.Year && p.PaymentDate.Month == bucket.Month)
                    .Sum(p => p.Amount);

                revenueByMonth.Add(new MonthlyRevenueDto { Month = bucket.Month, Year = bucket.Year, Total = total });
            }

            var overdueQuery = _context.Invoices.Where(i => i.Status == InvoiceStatus.QuaHan);
            var overdueCount = await overdueQuery.CountAsync();
            var overdueAmount = await overdueQuery.SumAsync(i => (decimal?)i.TotalAmount) ?? 0m;

            return new ReportDashboardDto
            {
                TotalRooms = totalRooms,
                OccupiedRooms = occupiedRooms,
                VacantRooms = vacantRooms,
                MaintenanceRooms = maintenanceRooms,
                OccupancyRate = totalRooms == 0 ? 0 : Math.Round(occupiedRooms * 100m / totalRooms, 2),

                TotalTenants = await _context.Tenants.CountAsync(),

                TotalRevenueThisMonth = revenueByMonth.Last().Total,
                RevenueByMonth = revenueByMonth,

                OverdueInvoiceCount = overdueCount,
                OverdueAmount = overdueAmount,

                PendingContracts = await _context.Contracts.CountAsync(c => c.Status == ContractStatus.ChoDuyet),
                PendingMaintenanceRequests = await _context.MaintenanceRequests.CountAsync(m => m.Status == MaintenanceStatus.Moi || m.Status == MaintenanceStatus.DaPhanCong)
            };
        }

        public async Task<PagedResultDto<ActivityLogDto>> GetLogsAsync(int page, int pageSize)
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 20;

            var query = _context.ActivityLogs
                .Include(x => x.User)
                .OrderByDescending(x => x.Id);

            var totalItems = await query.CountAsync();

            var items = await query
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
                .ToListAsync();

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
