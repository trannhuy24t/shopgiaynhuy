using ShopAPI.DTOs;
using ShopAPI.Interfaces;
using ShopAPI.Models;

namespace ShopAPI.Services
{
    public class CartService : ICartService
    {
        private readonly ICartRepository _cartRepository;
        private readonly IProductRepository _productRepository;

        public CartService(
            ICartRepository cartRepository,
            IProductRepository productRepository)
        {
            _cartRepository = cartRepository;
            _productRepository = productRepository;
        }

        public List<CartItemDto> GetCart(int userId)
        {
            var items = _cartRepository.GetByUserId(userId);

            return items.Select(c => new CartItemDto
            {
                Id = c.Id,
                ProductId = c.ProductId,
                ProductName = c.Product?.Name ?? "",
                ImageUrl = c.Product?.ImageUrl,
                Price = c.Product?.Price ?? 0,
                Quantity = c.Quantity,
                TotalPrice = (c.Product?.Price ?? 0) * c.Quantity
            }).ToList();
        }

        public bool AddToCart(int userId, AddToCartDto dto)
        {
            var product = _productRepository.GetById(dto.ProductId);

            if (product == null || !product.IsActive)
            {
                return false;
            }

            if (dto.Quantity <= 0)
            {
                return false;
            }

            if (product.Quantity < dto.Quantity)
            {
                return false;
            }

            var existingItem = _cartRepository.GetCartItem(userId, dto.ProductId);

            if (existingItem != null)
            {
                existingItem.Quantity += dto.Quantity;
                _cartRepository.Update(existingItem);
            }
            else
            {
                var cartItem = new CartItem
                {
                    UserId = userId,
                    ProductId = dto.ProductId,
                    Quantity = dto.Quantity,
                    CreatedAt = DateTime.Now
                };

                _cartRepository.Add(cartItem);
            }

            _cartRepository.Save();

            return true;
        }

        public bool UpdateQuantity(int userId, UpdateCartItemDto dto)
        {
            var cartItem = _cartRepository.GetById(dto.CartItemId);

            if (cartItem == null || cartItem.UserId != userId)
            {
                return false;
            }

            if (dto.Quantity <= 0)
            {
                return false;
            }

            if (cartItem.Product == null || cartItem.Product.Quantity < dto.Quantity)
            {
                return false;
            }

            cartItem.Quantity = dto.Quantity;

            _cartRepository.Update(cartItem);
            _cartRepository.Save();

            return true;
        }

        public bool RemoveItem(int userId, int cartItemId)
        {
            var cartItem = _cartRepository.GetById(cartItemId);

            if (cartItem == null || cartItem.UserId != userId)
            {
                return false;
            }

            _cartRepository.Delete(cartItem);
            _cartRepository.Save();

            return true;
        }

        public bool ClearCart(int userId)
        {
            var items = _cartRepository.GetByUserId(userId);

            foreach (var item in items)
            {
                _cartRepository.Delete(item);
            }

            _cartRepository.Save();

            return true;
        }
    }
}