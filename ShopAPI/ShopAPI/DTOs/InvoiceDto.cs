namespace ShopAPI.DTOs
{
    public class InvoiceItemDto
    {
        public string ItemName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
    }

    public class InvoiceDto
    {
        public int Id { get; set; }
        public int ContractId { get; set; }
        public string? RoomNumber { get; set; }
        public string? TenantName { get; set; }
        public int Month { get; set; }
        public int Year { get; set; }
        public int ElectricOldReading { get; set; }
        public int ElectricNewReading { get; set; }
        public int ElectricUsage { get; set; }
        public decimal ElectricUnitPrice { get; set; }

        public int WaterOldReading { get; set; }
        public int WaterNewReading { get; set; }
        public int WaterUsage { get; set; }
        public decimal WaterUnitPrice { get; set; }
        public decimal TotalAmount { get; set; }
        public string Type { get; set; } = string.Empty; // Coc | HangThang
        public string Status { get; set; } = string.Empty;
        public DateTime DueDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<InvoiceItemDto> Items { get; set; } = new();
    }
}
