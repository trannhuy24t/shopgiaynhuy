using ShopAPI.DTOs;

namespace ShopAPI.Interfaces
{
    public interface IProductService
    {
        List<ProductDto> GetAll();

        ProductDto? GetById(int id);
        PagedResultDto<ProductDto> Search(ProductQueryDto query);

        ProductDto Create(CreateProductDto dto);

        bool Update(UpdateProductDto dto);

        bool Delete(int id);
    }
}