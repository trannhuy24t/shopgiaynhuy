using ShopAPI.Models;

namespace ShopAPI.Interfaces
{
    public interface IOrderRepository
    {
        void AddOrder(Order order);

        void AddOrderDetail(OrderDetail detail);

        List<Order> GetOrdersByUser(int userId);

        Order? GetOrderById(int id);

        List<Order> GetAll();

        void Save();
    }
}