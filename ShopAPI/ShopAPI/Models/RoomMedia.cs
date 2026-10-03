using System.ComponentModel.DataAnnotations;

namespace ShopAPI.Models
{
    public class RoomMedia
    {
        [Key]
        public int Id { get; set; }

        public int RoomId { get; set; }
        public Room? Room { get; set; }

        [Required]
        public string Url { get; set; } = string.Empty;

        // Image | Video
        public string Type { get; set; } = "Image";

        public int SortOrder { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
