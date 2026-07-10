using ShopAPI.DTOs;

namespace ShopAPI.Interfaces
{
    public interface IOrderService
    {
        bool Checkout(int userId, CreateOrderDto dto);
        bool UpdateStatus(UpdateOrderStatusDto dto);

        List<OrderDto> GetMyOrders(int userId);

        OrderDto? GetById(int id);

        List<OrderDto> GetAll();
    }
}