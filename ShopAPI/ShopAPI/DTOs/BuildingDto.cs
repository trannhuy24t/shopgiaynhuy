namespace ShopAPI.DTOs
{
    public class BuildingDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public int OwnerId { get; set; }
        public string? OwnerName { get; set; }
        public string? Description { get; set; }
        public int RoomCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
