using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopAPI.DTOs;
using ShopAPI.Interfaces;

namespace ShopAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductController : ControllerBase
    {
        private readonly IProductService _productService;

        public ProductController(IProductService productService)
        {
            _productService = productService;
        }

        // Lấy tất cả sản phẩm
        [HttpGet]
        public IActionResult GetAll()
        {
            var products = _productService.GetAll();

            return Ok(products);
        }

        // Lấy sản phẩm theo Id
        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var product = _productService.GetById(id);

            if (product == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy sản phẩm."
                });
            }

            return Ok(product);
        }

        // Thêm sản phẩm
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public IActionResult Create(CreateProductDto dto)
        {
            var product = _productService.Create(dto);

            return Ok(product);
        }

        // Cập nhật sản phẩm
        [Authorize(Roles = "Admin")]
        [HttpPut]
        public IActionResult Update(UpdateProductDto dto)
        {
            bool result = _productService.Update(dto);

            if (!result)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy sản phẩm."
                });
            }

            return Ok(new
            {
                message = "Cập nhật thành công."
            });
        }

        // Xóa sản phẩm
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            bool result = _productService.Delete(id);

            if (!result)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy sản phẩm."
                });
            }

            return Ok(new
            {
                message = "Xóa thành công."
            });
        }
        [Authorize(Roles = "Admin")]
        [HttpPost("upload")]
        public IActionResult CreateWithImage([FromForm] CreateProductWithImageDto dto)
        {
            string? imageUrl = null;

            if (dto.Image != null && dto.Image.Length > 0)
            {
                var folderPath = Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "wwwroot",
                    "images",
                    "products"
                );

                if (!Directory.Exists(folderPath))
                {
                    Directory.CreateDirectory(folderPath);
                }

                var fileName = Guid.NewGuid().ToString()
                    + Path.GetExtension(dto.Image.FileName);

                var filePath = Path.Combine(folderPath, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    dto.Image.CopyTo(stream);
                }

                imageUrl = "/images/products/" + fileName;
            }

            var product = _productService.Create(new CreateProductDto
            {
                Name = dto.Name,
                Description = dto.Description,
                Price = dto.Price,
                Quantity = dto.Quantity,
                CategoryId = dto.CategoryId,
                ImageUrl = imageUrl
            });

            return Ok(product);
        }
        [HttpGet("search")]
        public IActionResult Search([FromQuery] ProductQueryDto query)
        {
            var result = _productService.Search(query);
            return Ok(result);
        }
    }
}