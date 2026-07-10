using ShopAPI.Models;

namespace ShopAPI.Interfaces
{
    public interface ICartRepository
    {
        List<CartItem> GetByUserId(int userId);

        CartItem? GetCartItem(int userId, int productId);

        CartItem? GetById(int id);

        void Add(CartItem cartItem);

        void Update(CartItem cartItem);

        void Delete(CartItem cartItem);

        void Save();
    }
}