using System.ComponentModel.DataAnnotations;

namespace ShopAPI.Models
{
    public class ProductSize
    {
        [Key]
        public int Id { get; set; }

        public int ProductId { get; set; }

        public Product? Product { get; set; }

        public int Size { get; set; }

        public int Quantity { get; set; }
    }
}