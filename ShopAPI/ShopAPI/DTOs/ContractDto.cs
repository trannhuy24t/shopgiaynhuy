namespace ShopAPI.DTOs
{
    public class ContractDto
    {
        public int Id { get; set; }
        public int RoomId { get; set; }
        public string? RoomNumber { get; set; }
        public string? RoomType { get; set; }
        public string? RoomAmenities { get; set; }
        public decimal RoomPrice { get; set; }
        public decimal RoomArea { get; set; }
        public decimal RoomServiceFee { get; set; }
        public string? BuildingName { get; set; }
        public string? BuildingAddress { get; set; }
        public string? LandlordName { get; set; }
        public string? LandlordPhone { get; set; }
        public string? RoomImageUrl { get; set; }
        public string? Image { get; set; }
        public List<string> RoomImages { get; set; } = new();

        public int TenantId { get; set; }
        public string? TenantName { get; set; }
        public string? TenantPhone { get; set; }
        public string? TenantIdCard { get; set; }
        public string? TenantEmail { get; set; }

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

        // Chữ ký số / Chữ ký điện tử
        public string? TenantSignatureUrl { get; set; }
        public DateTime? SignedAt { get; set; }
        public string? SignatureHash { get; set; }
        public string? LandlordSignatureUrl { get; set; }
        public DateTime? LandlordSignedAt { get; set; }
    }
}
