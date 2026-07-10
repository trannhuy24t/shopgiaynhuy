using ShopAPI.DTOs;

namespace ShopAPI.Interfaces
{
    public interface ICartService
    {
        List<CartItemDto> GetCart(int userId);

        bool AddToCart(int userId, AddToCartDto dto);

        bool UpdateQuantity(int userId, UpdateCartItemDto dto);

        bool RemoveItem(int userId, int cartItemId);

        bool ClearCart(int userId);
    }
}