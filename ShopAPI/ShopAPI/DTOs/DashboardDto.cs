namespace ShopAPI.DTOs
{
    public class DashboardDto
    {
        public int TotalProducts { get; set; }

        public int TotalOrders { get; set; }

        public int TotalUsers { get; set; }

        public decimal TotalRevenue { get; set; }
    }
}