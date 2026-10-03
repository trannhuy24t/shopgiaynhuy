namespace ShopAPI.DTOs
{
    public class RoomMediaDto
    {
        public int Id { get; set; }
        public string Url { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // Image | Video
        public int SortOrder { get; set; }
    }

    // Dùng nội bộ: Controller lưu file xong rồi truyền Url/Type xuống Service để ghi DB
    public class RoomMediaInputDto
    {
        public string Url { get; set; } = string.Empty;
        public string Type { get; set; } = "Image";
    }

    public class RoomDto
    {
        public int Id { get; set; }
        public int BuildingId { get; set; }
        public string? BuildingName { get; set; }
        public string? OwnerPhone { get; set; }
        public string RoomNumber { get; set; } = string.Empty;
        public decimal Area { get; set; }
        public decimal Price { get; set; }
        public decimal ServiceFee { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<RoomMediaDto> Media { get; set; } = new();

        // Số người đang ở thực tế (1 người thuê chính + số người ở cùng đã khai báo).
        // null nếu phòng hiện không có hợp đồng đang hiệu lực.
        public int? CurrentOccupants { get; set; }
    }
}
