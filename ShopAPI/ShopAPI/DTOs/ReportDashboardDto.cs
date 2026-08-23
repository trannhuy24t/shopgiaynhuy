namespace ShopAPI.DTOs
{
    public class MonthlyRevenueDto
    {
        public int Month { get; set; }
        public int Year { get; set; }
        public decimal Total { get; set; }
    }

    public class ReportDashboardDto
    {
        public int TotalRooms { get; set; }
        public int OccupiedRooms { get; set; }
        public int VacantRooms { get; set; }
        public int MaintenanceRooms { get; set; }
        public decimal OccupancyRate { get; set; }

        public int TotalTenants { get; set; }

        public decimal TotalRevenueThisMonth { get; set; }
        public List<MonthlyRevenueDto> RevenueByMonth { get; set; } = new();

        public int OverdueInvoiceCount { get; set; }
        public decimal OverdueAmount { get; set; }

        public int PendingContracts { get; set; }
        public int PendingMaintenanceRequests { get; set; }
    }
}
