using Microsoft.EntityFrameworkCore;
using ShopAPI.Data;
using ShopAPI.Interfaces;
using ShopAPI.Models;

namespace ShopAPI.Repositories
{
    public class CartRepository : ICartRepository
    {
        private readonly AppDbContext _context;

        public CartRepository(AppDbContext context)
        {
            _context = context;
        }

        public List<CartItem> GetByUserId(int userId)
        {
            return _context.CartItems
                .Include(c => c.Product)
                .Where(c => c.UserId == userId)
                .ToList();
        }

        public CartItem? GetCartItem(int userId, int productId)
        {
            return _context.CartItems
                .FirstOrDefault(c => c.UserId == userId && c.ProductId == productId);
        }

        public CartItem? GetById(int id)
        {
            return _context.CartItems
                .Include(c => c.Product)
                .FirstOrDefault(c => c.Id == id);
        }

        public void Add(CartItem cartItem)
        {
            _context.CartItems.Add(cartItem);
        }

        public void Update(CartItem cartItem)
        {
            _context.CartItems.Update(cartItem);
        }

        public void Delete(CartItem cartItem)
        {
            _context.CartItems.Remove(cartItem);
        }

        public void Save()
        {
            _context.SaveChanges();
        }
    }
}