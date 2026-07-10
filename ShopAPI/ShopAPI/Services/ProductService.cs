using ShopAPI.DTOs;
using ShopAPI.Interfaces;
using ShopAPI.Models;

namespace ShopAPI.Services
{
    public class ProductService : IProductService
    {
        private readonly IProductRepository _productRepository;

        public ProductService(IProductRepository productRepository)
        {
            _productRepository = productRepository;
        }

        public List<ProductDto> GetAll()
        {
            var products = _productRepository.GetAll();

            return products.Select(p => new ProductDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Price = p.Price,
                Quantity = p.Quantity,
                ImageUrl = p.ImageUrl,

                CategoryId = p.CategoryId,
                CategoryName = p.Category != null ? p.Category.Name : null,
                Sizes = p.ProductSizes.Select(s => new ProductSizeDto
                {
                    Size = s.Size,
                    Quantity = s.Quantity
                }).ToList(),

                IsActive = p.IsActive,
                CreatedAt = p.CreatedAt
            }).ToList();
        }

        public ProductDto? GetById(int id)
        {
            var product = _productRepository.GetById(id);

            if (product == null)
            {
                return null;
            }

            return new ProductDto
            {
                Id = product.Id,
                Name = product.Name,
                Description = product.Description,
                Price = product.Price,
                Quantity = product.Quantity,
                ImageUrl = product.ImageUrl,

                CategoryId = product.CategoryId,
                CategoryName = product.Category != null ? product.Category.Name : null,

                Sizes = product.ProductSizes.Select(s => new ProductSizeDto
                {
                    Size = s.Size,
                    Quantity = s.Quantity
                }).ToList(),

                IsActive = product.IsActive,
                CreatedAt = product.CreatedAt
            };
        }

        public ProductDto Create(CreateProductDto dto)
        {
            var product = new Product
            {
                Name = dto.Name,
                Description = dto.Description,
                Price = dto.Price,
                Quantity = dto.Quantity,
                ImageUrl = dto.ImageUrl,

                CategoryId = dto.CategoryId,

                IsActive = true,
                CreatedAt = DateTime.Now
            };

            _productRepository.Add(product);

            return new ProductDto
            {
                Id = product.Id,
                Name = product.Name,
                CategoryId = product.CategoryId,
                CategoryName = product.Category?.Name,
                Description = product.Description,
                Price = product.Price,
                Quantity = product.Quantity,
                ImageUrl = product.ImageUrl,
                IsActive = product.IsActive,
                CreatedAt = product.CreatedAt
            };
        }

        public bool Update(UpdateProductDto dto)
        {
            var product = _productRepository.GetById(dto.Id);

            if (product == null)
            {
                return false;
            }

            product.Name = dto.Name;
            product.Description = dto.Description;
            product.Price = dto.Price;
            product.Quantity = dto.Quantity;
            product.ImageUrl = dto.ImageUrl;

            product.CategoryId = dto.CategoryId;

            product.IsActive = dto.IsActive;

            _productRepository.Update(product);

            return true;
        }

        public bool Delete(int id)
        {
            var product = _productRepository.GetById(id);

            if (product == null)
            {
                return false;
            }

            _productRepository.Delete(product);

            return true;
        }
        public PagedResultDto<ProductDto> Search(ProductQueryDto query)
        {
            var products = _productRepository.GetAll().AsQueryable();

            if (!string.IsNullOrWhiteSpace(query.Keyword))
            {
                products = products.Where(p =>
                    p.Name.Contains(query.Keyword) ||
                    (p.Description != null && p.Description.Contains(query.Keyword)));
            }

            if (query.CategoryId.HasValue)
            {
                products = products.Where(p => p.CategoryId == query.CategoryId.Value);
            }

            if (query.MinPrice.HasValue)
            {
                products = products.Where(p => p.Price >= query.MinPrice.Value);
            }

            if (query.MaxPrice.HasValue)
            {
                products = products.Where(p => p.Price <= query.MaxPrice.Value);
            }

            products = query.SortBy switch
            {
                "price_asc" => products.OrderBy(p => p.Price),
                "price_desc" => products.OrderByDescending(p => p.Price),
                "newest" => products.OrderByDescending(p => p.CreatedAt),
                _ => products.OrderByDescending(p => p.Id)
            };

            var totalItems = products.Count();

            var items = products
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .Select(p => new ProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    Price = p.Price,
                    Quantity = p.Quantity,
                    ImageUrl = p.ImageUrl,
                    CategoryId = p.CategoryId,
                    CategoryName = p.Category != null ? p.Category.Name : null,
                    IsActive = p.IsActive,
                    CreatedAt = p.CreatedAt
                })
                .ToList();

            return new PagedResultDto<ProductDto>
            {
                TotalItems = totalItems,
                Page = query.Page,
                PageSize = query.PageSize,
                TotalPages = (int)Math.Ceiling(totalItems / (double)query.PageSize),
                Items = items
            };
        }
    }
}