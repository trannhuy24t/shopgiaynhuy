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
    public class InvoiceController : ControllerBase
    {
        private readonly IInvoiceService _invoiceService;

        public InvoiceController(IInvoiceService invoiceService)
        {
            _invoiceService = invoiceService;
        }

        private int GetUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        }

        // Staff nhập chỉ số điện/nước để tạo hóa đơn hàng tháng
        [Authorize(Roles = "Staff,Admin")]
        [HttpPost]
        public IActionResult Create(CreateInvoiceDto dto)
        {
            var (invoice, error) = _invoiceService.CreateMonthly(dto, GetUserId());

            if (invoice == null)
            {
                return BadRequest(new { message = error ?? "Không thể tạo hóa đơn." });
            }

            return Ok(invoice);
        }

        [Authorize(Roles = "Tenant")]
        [HttpGet("my")]
        public IActionResult GetMy()
        {
            var invoices = _invoiceService.GetMy(GetUserId());

            return Ok(invoices);
        }

        [Authorize(Roles = "Staff,Admin")]
        [HttpGet]
        public IActionResult GetAll([FromQuery] string? status, [FromQuery] int? contractId)
        {
            var invoices = _invoiceService.GetAll(status, contractId);

            return Ok(invoices);
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var isStaffOrAdmin = User.IsInRole("Admin") || User.IsInRole("Staff");

            if (!isStaffOrAdmin && !_invoiceService.IsOwnedByUser(id, GetUserId()))
            {
                return Forbid();
            }

            var invoice = _invoiceService.GetById(id);

            if (invoice == null)
            {
                return NotFound(new { message = "Không tìm thấy hóa đơn." });
            }

            return Ok(invoice);
        }
    }
}
