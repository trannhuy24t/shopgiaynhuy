using ShopAPI.DTOs;
using ShopAPI.Interfaces;
using ShopAPI.Models;

namespace ShopAPI.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly ICategoryRepository _categoryRepository;

        public CategoryService(ICategoryRepository categoryRepository)
        {
            _categoryRepository = categoryRepository;
        }

        public List<CategoryDto> GetAll()
        {
            var categories = _categoryRepository.GetAll();

            return categories.Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                IsActive = c.IsActive,
                CreatedAt = c.CreatedAt
            }).ToList();
        }

        public CategoryDto? GetById(int id)
        {
            var category = _categoryRepository.GetById(id);

            if (category == null)
            {
                return null;
            }

            return new CategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                IsActive = category.IsActive,
                CreatedAt = category.CreatedAt
            };
        }

        public CategoryDto Create(CreateCategoryDto dto)
        {
            var category = new Category
            {
                Name = dto.Name,
                IsActive = true,
                CreatedAt = DateTime.Now
            };

            _categoryRepository.Add(category);

            return new CategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                IsActive = category.IsActive,
                CreatedAt = category.CreatedAt
            };
        }

        public bool Update(UpdateCategoryDto dto)
        {
            var category = _categoryRepository.GetById(dto.Id);

            if (category == null)
            {
                return false;
            }

            category.Name = dto.Name;
            category.IsActive = dto.IsActive;

            _categoryRepository.Update(category);

            return true;
        }

        public bool Delete(int id)
        {
            var category = _categoryRepository.GetById(id);

            if (category == null)
            {
                return false;
            }

            _categoryRepository.Delete(category);

            return true;
        }
    }
}