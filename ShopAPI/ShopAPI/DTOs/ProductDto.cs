namespace ShopAPI.DTOs
{
    public class ProductDto
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }
        public int? CategoryId { get; set; }

        public string? CategoryName { get; set; }

        public decimal Price { get; set; }

        public int Quantity { get; set; }

        public string? ImageUrl { get; set; }
        public List<ProductSizeDto> Sizes { get; set; } = new();

        public bool IsActive { get; set; }


        public DateTime CreatedAt { get; set; }
    }
}