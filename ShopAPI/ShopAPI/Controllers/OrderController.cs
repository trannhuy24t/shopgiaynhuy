using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopAPI.DTOs;
using ShopAPI.Interfaces;
using System.Security.Claims;

namespace ShopAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OrderController : ControllerBase
    {
        private readonly IOrderService _orderService;

        public OrderController(IOrderService orderService)
        {
            _orderService = orderService;
        }

        private int GetUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        }

        [HttpPost("checkout")]
        public IActionResult Checkout(CreateOrderDto dto)
        {
            var userId = GetUserId();

            var result = _orderService.Checkout(userId, dto);

            if (!result)
            {
                return BadRequest(new
                {
                    message = "Không thể đặt hàng. Giỏ hàng rỗng hoặc sản phẩm không đủ tồn kho."
                });
            }

            return Ok(new
            {
                message = "Đặt hàng thành công."
            });
        }

        [HttpGet("my-orders")]
        public IActionResult GetMyOrders()
        {
            var userId = GetUserId();

            var orders = _orderService.GetMyOrders(userId);

            return Ok(orders);
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var order = _orderService.GetById(id);

            if (order == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy đơn hàng."
                });
            }

            return Ok(order);
        }

        [Authorize(Roles = "Admin")]
        [HttpGet]
        public IActionResult GetAll()
        {
            var orders = _orderService.GetAll();

            return Ok(orders);
        }
        [Authorize(Roles = "Admin")]
        [HttpPut("status")]
        public IActionResult UpdateStatus(UpdateOrderStatusDto dto)
        {
            var result = _orderService.UpdateStatus(dto);

            if (!result)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy đơn hàng."
                });
            }

            return Ok(new
            {
                message = "Cập nhật trạng thái đơn hàng thành công."
            });
        }
    }
}