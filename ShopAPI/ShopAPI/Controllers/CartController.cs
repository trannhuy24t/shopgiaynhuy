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
    public class CartController : ControllerBase
    {
        private readonly ICartService _cartService;

        public CartController(ICartService cartService)
        {
            _cartService = cartService;
        }

        // Lấy UserId từ JWT
        private int GetUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        }

        // Xem giỏ hàng
        [HttpGet]
        public IActionResult GetCart()
        {
            var userId = GetUserId();

            var result = _cartService.GetCart(userId);

            return Ok(result);
        }

        // Thêm sản phẩm vào giỏ
        [HttpPost("add")]
        public IActionResult AddToCart(AddToCartDto dto)
        {
            var userId = GetUserId();

            bool result = _cartService.AddToCart(userId, dto);

            if (!result)
            {
                return BadRequest(new
                {
                    message = "Không thể thêm sản phẩm vào giỏ."
                });
            }

            return Ok(new
            {
                message = "Đã thêm vào giỏ hàng."
            });
        }

        // Cập nhật số lượng
        [HttpPut("update")]
        public IActionResult Update(UpdateCartItemDto dto)
        {
            var userId = GetUserId();

            bool result = _cartService.UpdateQuantity(userId, dto);

            if (!result)
            {
                return BadRequest(new
                {
                    message = "Không thể cập nhật."
                });
            }

            return Ok(new
            {
                message = "Cập nhật thành công."
            });
        }

        // Xóa một sản phẩm
        [HttpDelete("{cartItemId}")]
        public IActionResult Delete(int cartItemId)
        {
            var userId = GetUserId();

            bool result = _cartService.RemoveItem(userId, cartItemId);

            if (!result)
            {
                return BadRequest(new
                {
                    message = "Không thể xóa."
                });
            }

            return Ok(new
            {
                message = "Đã xóa."
            });
        }

        // Xóa toàn bộ giỏ hàng
        [HttpDelete("clear")]
        public IActionResult Clear()
        {
            var userId = GetUserId();

            _cartService.ClearCart(userId);

            return Ok(new
            {
                message = "Đã xóa toàn bộ giỏ hàng."
            });
        }
    }
}