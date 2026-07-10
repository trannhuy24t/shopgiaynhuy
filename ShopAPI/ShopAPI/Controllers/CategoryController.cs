using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopAPI.DTOs;
using ShopAPI.Interfaces;

namespace ShopAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoryController : ControllerBase
    {
        private readonly ICategoryService _categoryService;

        public CategoryController(ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        [HttpGet]
        public IActionResult GetAll()
        {
            var categories = _categoryService.GetAll();
            return Ok(categories);
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var category = _categoryService.GetById(id);

            if (category == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy danh mục."
                });
            }

            return Ok(category);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public IActionResult Create(CreateCategoryDto dto)
        {
            var category = _categoryService.Create(dto);
            return Ok(category);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut]
        public IActionResult Update(UpdateCategoryDto dto)
        {
            var result = _categoryService.Update(dto);

            if (!result)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy danh mục."
                });
            }

            return Ok(new
            {
                message = "Cập nhật danh mục thành công."
            });
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var result = _categoryService.Delete(id);

            if (!result)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy danh mục."
                });
            }

            return Ok(new
            {
                message = "Xóa danh mục thành công."
            });
        }
    }
}