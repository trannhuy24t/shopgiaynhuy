namespace ShopAPI.DTOs
{
    public class ActivityLogDto
    {
        public int Id { get; set; }
        public int? UserId { get; set; }
        public string? UserName { get; set; }
        public string Action { get; set; } = string.Empty;
        public string EntityName { get; set; } = string.Empty;
        public int? EntityId { get; set; }
        public string? Detail { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
