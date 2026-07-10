using ShopAPI.DTOs;
using ShopAPI.Interfaces;
using ShopAPI.Models;

namespace ShopAPI.Services
{
    public class OrderService : IOrderService
    {
        private readonly IOrderRepository _orderRepository;
        private readonly ICartRepository _cartRepository;
        private readonly IProductRepository _productRepository;

        public OrderService(
            IOrderRepository orderRepository,
            ICartRepository cartRepository,
            IProductRepository productRepository)
        {
            _orderRepository = orderRepository;
            _cartRepository = cartRepository;
            _productRepository = productRepository;
        }

        public bool Checkout(int userId, CreateOrderDto dto)
        {
            var cartItems = _cartRepository.GetByUserId(userId);

            if (cartItems.Count == 0)
            {
                return false;
            }

            foreach (var item in cartItems)
            {
                if (item.Product == null || item.Product.Quantity < item.Quantity)
                {
                    return false;
                }
            }

            var totalAmount = cartItems.Sum(item =>
                (item.Product?.Price ?? 0) * item.Quantity
            );

            var order = new Order
            {
                UserId = userId,
                TotalAmount = totalAmount,
                Status = "Pending",
                CreatedAt = DateTime.Now
            };

            _orderRepository.AddOrder(order);
            _orderRepository.Save();

            foreach (var item in cartItems)
            {
                var detail = new OrderDetail
                {
                    OrderId = order.Id,
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    Price = item.Product!.Price
                };

                _orderRepository.AddOrderDetail(detail);

                item.Product.Quantity -= item.Quantity;
                _productRepository.Update(item.Product);

                _cartRepository.Delete(item);
            }

            _orderRepository.Save();
            _cartRepository.Save();

            return true;
        }

        public List<OrderDto> GetMyOrders(int userId)
        {
            var orders = _orderRepository.GetOrdersByUser(userId);

            return orders.Select(o => MapToDto(o)).ToList();
        }

        public OrderDto? GetById(int id)
        {
            var order = _orderRepository.GetOrderById(id);

            if (order == null)
            {
                return null;
            }

            return MapToDto(order);
        }

        public List<OrderDto> GetAll()
        {
            var orders = _orderRepository.GetAll();

            return orders.Select(o => MapToDto(o)).ToList();
        }

        private OrderDto MapToDto(Order order)
        {
            return new OrderDto
            {
                Id = order.Id,
                TotalAmount = order.TotalAmount,
                Status = order.Status,
                CreatedAt = order.CreatedAt,
                Items = order.OrderDetails.Select(d => new OrderDetailDto
                {
                    ProductId = d.ProductId,
                    ProductName = d.Product?.Name ?? "",
                    ImageUrl = d.Product?.ImageUrl,
                    Quantity = d.Quantity,
                    Price = d.Price,
                    TotalPrice = d.Price * d.Quantity
                }).ToList()
            };
        }
        public bool UpdateStatus(UpdateOrderStatusDto dto)
        {
            var order = _orderRepository.GetOrderById(dto.OrderId);

            if (order == null)
            {
                return false;
            }

            order.Status = dto.Status;

            _orderRepository.Save();

            return true;
        }
    }
}