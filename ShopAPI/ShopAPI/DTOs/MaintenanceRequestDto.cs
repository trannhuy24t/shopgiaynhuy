namespace ShopAPI.DTOs
{
    public class MaintenanceReplyDto
    {
        [System.ComponentModel.DataAnnotations.Required]
        [System.ComponentModel.DataAnnotations.MaxLength(2000)]
        public string Message { get; set; } = string.Empty;
    }

    public class MaintenanceRequestDto
    {
        public int Id { get; set; }
        public int RoomId { get; set; }
        public string? RoomNumber { get; set; }
        public string? BuildingName { get; set; }
        public string? BuildingAddress { get; set; }
        public string? LandlordName { get; set; }
        public string? LandlordPhone { get; set; }
        public int TenantId { get; set; }
        public string? TenantName { get; set; }
        public string? TenantPhone { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public string Priority { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int? AssignedToUserId { get; set; }
        public string? AssignedToUserName { get; set; }
        public string? AssignedToUserPhone { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public string? Note { get; set; }
    }
}
