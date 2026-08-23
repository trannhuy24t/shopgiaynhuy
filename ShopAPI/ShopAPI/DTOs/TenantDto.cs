namespace ShopAPI.DTOs
{
    public class TenantDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string? UserEmail { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? IdCardNumber { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? EmergencyContact { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
