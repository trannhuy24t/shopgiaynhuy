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
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly IInvoiceService _invoiceService;

        public PaymentController(IPaymentService paymentService, IInvoiceService invoiceService)
        {
            _paymentService = paymentService;
            _invoiceService = invoiceService;
        }

        private int GetUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        }

        // Khách thuê lấy mã VietQR để thanh toán trực tuyến
        [Authorize(Roles = "Tenant")]
        [HttpGet("qr/{invoiceId}")]
        public IActionResult GetQr(int invoiceId)
        {
            var qr = _paymentService.GetQrForInvoice(invoiceId, GetUserId());

            if (qr == null)
            {
                return NotFound(new { message = "Không tìm thấy hóa đơn." });
            }

            return Ok(qr);
        }

        [Authorize(Roles = "Tenant")]
        [HttpPost("submit-transfer")]
        public IActionResult SubmitTransfer(SubmitTransferDto dto)
        {
            var result = _paymentService.SubmitTransfer(dto, GetUserId());
            return result.Success ? Ok(new { message = result.Message }) : BadRequest(new { message = result.Message });
        }

        [HttpGet("invoice/{invoiceId}")]
        public IActionResult GetByInvoice(int invoiceId)
        {
            var isStaffOrAdmin = User.IsInRole("Admin") || User.IsInRole("Staff");

            if (!isStaffOrAdmin && !_invoiceService.IsOwnedByUser(invoiceId, GetUserId()))
            {
                return Forbid();
            }

            var payments = _paymentService.GetByInvoiceId(invoiceId);

            return Ok(payments);
        }

        // Staff xác nhận đã nhận thanh toán (tiền mặt/chuyển khoản/QR)
        [Authorize(Roles = "Staff,Admin")]
        [HttpPut("confirm-cash")]
        public IActionResult ConfirmCash(ConfirmPaymentDto dto)
        {
            var result = _paymentService.ConfirmCash(dto, GetUserId());

            if (!result)
            {
                return BadRequest(new { message = "Không thể xác nhận thanh toán (hóa đơn không tồn tại hoặc đã được thanh toán)." });
            }

            return Ok(new { message = "Xác nhận thanh toán thành công." });
        }

        [Authorize(Roles = "Staff,Admin")]
        [HttpPut("{paymentId}/confirm-transfer")]
        public IActionResult ConfirmTransfer(int paymentId)
        {
            var result = _paymentService.ConfirmTransfer(paymentId, GetUserId());
            return result ? Ok(new { message = "Đã xác nhận giao dịch chuyển khoản." }) : BadRequest(new { message = "Giao dịch không còn chờ xác nhận hoặc số tiền không khớp." });
        }

        [Authorize(Roles = "Staff,Admin")]
        [HttpPut("{paymentId}/reject-transfer")]
        public IActionResult RejectTransfer(int paymentId)
        {
            var result = _paymentService.RejectTransfer(paymentId, GetUserId());
            return result ? Ok(new { message = "Đã từ chối giao dịch." }) : BadRequest(new { message = "Giao dịch không còn chờ xác nhận." });
        }
    }
}
