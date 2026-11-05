using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopAPI.DTOs;
using ShopAPI.Interfaces;

namespace ShopAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PushNotificationController : ControllerBase
    {
        private readonly IPushNotificationService _pushService;

        public PushNotificationController(IPushNotificationService pushService)
        {
            _pushService = pushService;
        }

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(claim, out var id)) return id;
            return null;
        }

        [HttpGet("vapid-public-key")]
        public IActionResult GetVapidPublicKey()
        {
            var key = _pushService.GetVapidPublicKey();
            return Ok(new { publicKey = key });
        }

        [HttpGet("status")]
        [Authorize]
        public async Task<IActionResult> GetStatus([FromQuery] string? endpoint = null)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var status = await _pushService.GetStatusAsync(userId.Value, endpoint);
            return Ok(status);
        }

        [HttpPost("subscribe")]
        [Authorize]
        public async Task<IActionResult> Subscribe([FromBody] SubscribePushDto dto)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            await _pushService.SubscribeAsync(userId.Value, dto);
            return Ok(new { message = "Đã đăng ký nhận thông báo đẩy thành công trên thiết bị này." });
        }

        [HttpPost("unsubscribe")]
        [Authorize]
        public async Task<IActionResult> Unsubscribe([FromBody] UnsubscribePushDto dto)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            await _pushService.UnsubscribeAsync(userId.Value, dto.Endpoint);
            return Ok(new { message = "Đã hủy đăng ký nhận thông báo đẩy." });
        }

        [HttpPost("test-my-device")]
        [Authorize]
        public async Task<IActionResult> TestMyDevice([FromBody] SendPushTestDto? dto)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var sent = await _pushService.SendTestPushAsync(userId.Value, dto?.Title, dto?.Content, dto?.Url);
            if (!sent)
            {
                return BadRequest(new { message = "Bạn chưa đăng ký nhận thông báo đẩy trên thiết bị này. Vui lòng bật thông báo trước!" });
            }

            return Ok(new { message = "Đã gửi thông báo đẩy thử nghiệm tới thiết bị của bạn!" });
        }

        [HttpPost("broadcast")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Broadcast([FromBody] SendPushTestDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Content))
            {
                return BadRequest(new { message = "Tiêu đề và nội dung thông báo không được để trống." });
            }

            await _pushService.SendPushToAllAsync(dto.Title, dto.Content, dto.Url);
            return Ok(new { message = "Đã đẩy thông báo tới toàn bộ thiết bị đã đăng ký." });
        }
    }
}

