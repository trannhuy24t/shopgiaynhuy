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
    public class MaintenanceController : ControllerBase
    {
        private readonly IMaintenanceRequestService _requestService;

        public MaintenanceController(IMaintenanceRequestService requestService)
        {
            _requestService = requestService;
        }

        private int GetUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        }

        // Khách thuê gửi yêu cầu bảo trì / sự cố
        [Authorize(Roles = "Tenant")]
        [HttpPost]
        public IActionResult Create(CreateMaintenanceRequestDto dto)
        {
            var request = _requestService.Create(GetUserId(), dto);

            if (request == null)
            {
                return BadRequest(new { message = "Không thể gửi yêu cầu (bạn không có hợp đồng đang hiệu lực cho phòng này)." });
            }

            return Ok(request);
        }

        [Authorize(Roles = "Tenant")]
        [HttpPost("upload")]
        public IActionResult CreateWithImage([FromForm] CreateMaintenanceRequestWithImageDto dto)
        {
            string? imageUrl = null;

            if (dto.Image != null && dto.Image.Length > 0)
            {
                var folderPath = Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "wwwroot",
                    "images",
                    "maintenance"
                );

                if (!Directory.Exists(folderPath))
                {
                    Directory.CreateDirectory(folderPath);
                }

                var fileName = Guid.NewGuid().ToString()
                    + Path.GetExtension(dto.Image.FileName);

                var filePath = Path.Combine(folderPath, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    dto.Image.CopyTo(stream);
                }

                imageUrl = "/images/maintenance/" + fileName;
            }

            var request = _requestService.Create(GetUserId(), new CreateMaintenanceRequestDto
            {
                RoomId = dto.RoomId,
                Title = dto.Title,
                Description = dto.Description,
                Priority = dto.Priority,
                ImageUrl = imageUrl
            });

            if (request == null)
            {
                return BadRequest(new { message = "Không thể gửi yêu cầu (bạn không có hợp đồng đang hiệu lực cho phòng này)." });
            }

            return Ok(request);
        }

        [Authorize(Roles = "Tenant")]
        [HttpGet("my")]
        public IActionResult GetMy()
        {
            var requests = _requestService.GetMy(GetUserId());

            return Ok(requests);
        }

        [Authorize(Roles = "Staff,Admin")]
        [HttpGet]
        public IActionResult GetAll([FromQuery] string? status)
        {
            var requests = _requestService.GetAll(status);

            return Ok(requests);
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var isStaffOrAdmin = User.IsInRole("Admin") || User.IsInRole("Staff");

            if (!isStaffOrAdmin && !_requestService.IsOwnedByUser(id, GetUserId()))
            {
                return Forbid();
            }

            var request = _requestService.GetById(id);

            if (request == null)
            {
                return NotFound(new { message = "Không tìm thấy yêu cầu bảo trì." });
            }

            return Ok(request);
        }

        // Staff tiếp nhận, phân công xử lý
        [Authorize(Roles = "Staff,Admin")]
        [HttpPut("{id}/assign")]
        public IActionResult Assign(int id, AssignMaintenanceDto dto)
        {
            var result = _requestService.Assign(id, dto, GetUserId());

            if (!result)
            {
                return BadRequest(new { message = "Không thể phân công (yêu cầu không tồn tại hoặc đã xử lý xong)." });
            }

            return Ok(new { message = "Phân công thành công." });
        }

        [Authorize(Roles = "Staff,Admin")]
        [HttpPut("{id}/status")]
        public IActionResult UpdateStatus(int id, UpdateMaintenanceStatusDto dto)
        {
            var result = _requestService.UpdateStatus(id, dto, GetUserId());

            if (!result)
            {
                return NotFound(new { message = "Không tìm thấy yêu cầu bảo trì." });
            }

            return Ok(new { message = "Cập nhật trạng thái thành công." });
        }
    }
}
