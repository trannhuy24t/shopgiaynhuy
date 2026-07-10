using ShopAPI.Models;

namespace ShopAPI.Interfaces
{
    public interface ICategoryRepository
    {
        List<Category> GetAll();

        Category? GetById(int id);

        void Add(Category category);

        void Update(Category category);

        void Delete(Category category);
    }
}