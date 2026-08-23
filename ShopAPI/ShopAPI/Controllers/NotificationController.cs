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
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        private int GetUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        }

        [HttpGet("my")]
        public IActionResult GetMy()
        {
            var notifications = _notificationService.GetMy(GetUserId());

            return Ok(notifications);
        }

        [HttpPut("{id}/read")]
        public IActionResult MarkRead(int id)
        {
            var result = _notificationService.MarkRead(id, GetUserId());

            if (!result)
            {
                return NotFound(new { message = "Không tìm thấy thông báo." });
            }

            return Ok(new { message = "Đã đánh dấu đã đọc." });
        }

        // Staff/Admin gửi thông báo cho khách thuê
        [Authorize(Roles = "Staff,Admin")]
        [HttpPost]
        public IActionResult Create(CreateNotificationDto dto)
        {
            var notification = _notificationService.Create(dto, GetUserId());

            return Ok(notification);
        }

        // Staff/Admin nhắc nợ tự động cho toàn bộ hóa đơn quá hạn
        [Authorize(Roles = "Staff,Admin")]
        [HttpPost("remind-overdue")]
        public IActionResult RemindOverdue()
        {
            var count = _notificationService.RemindOverdue(GetUserId());

            return Ok(new { message = $"Đã gửi nhắc nợ cho {count} hóa đơn quá hạn.", count });
        }

        // Staff/Admin nhắc các hóa đơn sắp đến hạn (chưa quá hạn) — báo cả Tenant lẫn Admin/Staff
        [Authorize(Roles = "Staff,Admin")]
        [HttpPost("remind-upcoming-invoices")]
        public IActionResult RemindUpcomingInvoices([FromQuery] int daysBefore = 3)
        {
            var count = _notificationService.RemindUpcomingInvoices(GetUserId(), daysBefore);

            return Ok(new { message = $"Đã nhắc {count} hóa đơn sắp đến hạn.", count });
        }

        // Staff/Admin nhắc các hợp đồng sắp hết hạn — báo cả Tenant lẫn Admin/Staff
        [Authorize(Roles = "Staff,Admin")]
        [HttpPost("remind-upcoming-contracts")]
        public IActionResult RemindUpcomingContracts([FromQuery] int daysBefore = 7)
        {
            var count = _notificationService.RemindUpcomingContracts(GetUserId(), daysBefore);

            return Ok(new { message = $"Đã nhắc {count} hợp đồng sắp hết hạn.", count });
        }
    }
}
