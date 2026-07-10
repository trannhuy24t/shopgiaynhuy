using ShopAPI.DTOs;

namespace ShopAPI.Interfaces
{
    public interface ICategoryService
    {
        List<CategoryDto> GetAll();

        CategoryDto? GetById(int id);

        CategoryDto Create(CreateCategoryDto dto);

        bool Update(UpdateCategoryDto dto);

        bool Delete(int id);
    }
}