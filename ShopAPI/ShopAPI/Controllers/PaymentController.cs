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
        private readonly IConfiguration _configuration;

        public PaymentController(IPaymentService paymentService, IInvoiceService invoiceService, IConfiguration configuration)
        {
            _paymentService = paymentService;
            _invoiceService = invoiceService;
            _configuration = configuration;
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

        // Endpoint Webhook nhận biến động số dư tự động từ SePay (sepay.vn)
        [AllowAnonymous]
        [HttpPost("sepay-webhook")]
        public IActionResult SePayWebhook([FromBody] SePayWebhookDto dto)
        {
            var configuredApiKey = _configuration["SePay:ApiKey"];
            if (!string.IsNullOrWhiteSpace(configuredApiKey))
            {
                var authHeader = Request.Headers.Authorization.ToString();
                var expectedHeader = $"Apikey {configuredApiKey}";
                if (!string.Equals(authHeader, expectedHeader, StringComparison.OrdinalIgnoreCase) &&
                    !string.Equals(authHeader, configuredApiKey, StringComparison.OrdinalIgnoreCase))
                {
                    return Unauthorized(new { message = "Sai SePay API Key." });
                }
            }

            var result = _paymentService.ProcessSePayWebhook(dto);
            if (!result.Success)
            {
                return BadRequest(new { success = false, message = result.Message });
            }

            return Ok(new { success = true, message = result.Message, invoiceId = result.InvoiceId });
        }

        // Endpoint giả lập webhook SePay để test chức năng tự động nhận diện thanh toán ngay tại máy
        [HttpPost("simulate-transfer/{invoiceId}")]
        public IActionResult SimulateTransfer(int invoiceId)
        {
            var isStaffOrAdmin = User.IsInRole("Admin") || User.IsInRole("Staff");
            if (!isStaffOrAdmin && !_invoiceService.IsOwnedByUser(invoiceId, GetUserId()))
            {
                return Forbid();
            }

            var result = _paymentService.SimulateTransfer(invoiceId);
            return result.Success
                ? Ok(new { success = true, message = result.Message })
                : BadRequest(new { success = false, message = result.Message });
        }
    }
}
