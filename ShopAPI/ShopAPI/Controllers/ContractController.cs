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
    public class ContractController : ControllerBase
    {
        private readonly IContractService _contractService;

        public ContractController(IContractService contractService)
        {
            _contractService = contractService;
        }

        private int GetUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        }

        // Khách thuê đăng ký thuê phòng
        [Authorize(Roles = "Tenant")]
        [HttpPost("request")]
        public IActionResult RequestContract(RequestContractDto dto)
        {
            var contract = _contractService.Request(GetUserId(), dto);

            if (contract == null)
            {
                return BadRequest(new { message = "Không thể đăng ký thuê. Phòng không tồn tại hoặc không còn trống." });
            }

            return Ok(contract);
        }

        [Authorize(Roles = "Tenant")]
        [HttpGet("my")]
        public IActionResult GetMy()
        {
            var contracts = _contractService.GetMy(GetUserId());

            return Ok(contracts);
        }

        [Authorize(Roles = "Admin,Staff")]
        [HttpGet]
        public IActionResult GetAll([FromQuery] string? status)
        {
            var contracts = _contractService.GetAll(status);

            return Ok(contracts);
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var isStaffOrAdmin = User.IsInRole("Admin") || User.IsInRole("Staff");

            if (!isStaffOrAdmin && !_contractService.IsOwnedByUser(id, GetUserId()))
            {
                return Forbid();
            }

            var contract = _contractService.GetById(id);

            if (contract == null)
            {
                return NotFound(new { message = "Không tìm thấy hợp đồng." });
            }

            return Ok(contract);
        }

        // Admin duyệt hợp đồng, cấu hình giá
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}/approve")]
        public IActionResult Approve(int id, ApproveContractDto dto)
        {
            var result = _contractService.Approve(id, dto, GetUserId());

            if (!result)
            {
                return BadRequest(new { message = "Không thể duyệt hợp đồng này (không tồn tại hoặc không ở trạng thái chờ duyệt)." });
            }

            return Ok(new { message = "Duyệt hợp đồng thành công, chờ khách thuê đóng cọc." });
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}/reject")]
        public IActionResult Reject(int id, RejectContractDto dto)
        {
            var result = _contractService.Reject(id, dto, GetUserId());

            if (!result)
            {
                return BadRequest(new { message = "Không thể từ chối hợp đồng này (không tồn tại hoặc không ở trạng thái chờ duyệt)." });
            }

            return Ok(new { message = "Đã từ chối hợp đồng." });
        }

        // Gán/sửa đơn giá điện/nước cho hợp đồng đang hiệu lực mà chưa có (hợp đồng cũ, duyệt
        // trước khi có tính năng chốt giá) — không cần quay lại bước approve. Tự thông báo cho Tenant.
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}/set-unit-price")]
        public IActionResult SetUnitPrice(int id, SetContractUnitPriceDto dto)
        {
            var (success, error) = _contractService.SetUnitPrice(id, dto, GetUserId());

            if (!success)
            {
                return BadRequest(new { message = error ?? "Không thể cập nhật đơn giá." });
            }

            return Ok(new { message = "Đã cập nhật đơn giá điện/nước và gửi thông báo cho khách thuê." });
        }

        [Authorize(Roles = "Admin,Staff")]
        [HttpPut("{id}/terminate")]
        public IActionResult Terminate(int id)
        {
            var result = _contractService.Terminate(id, GetUserId());

            if (!result)
            {
                return BadRequest(new { message = "Không thể kết thúc hợp đồng này (không tồn tại hoặc chưa có hiệu lực)." });
            }

            return Ok(new { message = "Đã kết thúc hợp đồng." });
        }

        // Danh sách người ở cùng của 1 hợp đồng (không tính người thuê chính)
        [HttpGet("{id}/occupant")]
        public IActionResult GetOccupants(int id)
        {
            var isStaffOrAdmin = User.IsInRole("Admin") || User.IsInRole("Staff");

            if (!isStaffOrAdmin && !_contractService.IsOwnedByUser(id, GetUserId()))
            {
                return Forbid();
            }

            var occupants = _contractService.GetOccupants(id);

            if (occupants == null)
            {
                return NotFound(new { message = "Không tìm thấy hợp đồng." });
            }

            return Ok(occupants);
        }

        // Khách thuê (hoặc Admin/Staff) thêm người ở cùng vào hợp đồng đang hiệu lực
        [HttpPost("{id}/occupant")]
        public IActionResult AddOccupant(int id, CreateOccupantDto dto)
        {
            var isStaffOrAdmin = User.IsInRole("Admin") || User.IsInRole("Staff");

            if (!isStaffOrAdmin && !_contractService.IsOwnedByUser(id, GetUserId()))
            {
                return Forbid();
            }

            var (occupants, error) = _contractService.AddOccupant(id, dto, GetUserId());

            if (occupants == null)
            {
                return BadRequest(new { message = error ?? "Không thể thêm người." });
            }

            return Ok(occupants);
        }
    }
}
