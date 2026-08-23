using System.ComponentModel.DataAnnotations;

namespace ShopAPI.DTOs
{
    public class SetContractUnitPriceDto
    {
        [Required]
        public decimal ElectricUnitPrice { get; set; }

        [Required]
        public decimal WaterUnitPrice { get; set; }
    }
}
