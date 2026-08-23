namespace ShopAPI.DTOs
{
    public class ContractDto
    {
        public int Id { get; set; }
        public int RoomId { get; set; }
        public string? RoomNumber { get; set; }
        public int TenantId { get; set; }
        public string? TenantName { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal Deposit { get; set; }
        public decimal MonthlyRent { get; set; }
        public int NumberOfOccupants { get; set; }
        public decimal ElectricUnitPrice { get; set; }
        public decimal WaterUnitPrice { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public List<OccupantDto> Occupants { get; set; } = new();
    }
}
