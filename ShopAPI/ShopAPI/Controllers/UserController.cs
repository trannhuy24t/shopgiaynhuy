using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopAPI.DTOs;
using ShopAPI.Interfaces;
using System.Security.Claims;

namespace ShopAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;

        public UserController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet]
        public IActionResult GetAll([FromQuery] string? role)
        {
            var users = _userService.GetAll(role);

            return Ok(users);
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var user = _userService.GetById(id);

            if (user == null)
            {
                return NotFound(new { message = "Không tìm thấy người dùng." });
            }

            return Ok(user);
        }

        [HttpPost("staff")]
        public IActionResult CreateStaff(CreateStaffDto dto)
        {
            var user = _userService.CreateStaff(dto);

            if (user == null)
            {
                return BadRequest(new { message = "Email đã tồn tại." });
            }

            return Ok(user);
        }

        [HttpPost("tenant")]
        public IActionResult CreateTenantAccount(CreateTenantAccountDto dto)
        {
            var user = _userService.CreateTenantAccount(dto);

            if (user == null)
            {
                return BadRequest(new { message = "Email đã tồn tại." });
            }

            return Ok(user);
        }

        [HttpPut("profile")]
        [Authorize]
        public IActionResult UpdateProfile(UpdateProfileDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
                return Unauthorized();

            var result = _userService.UpdateProfile(userId, dto);
            if (result == null)
                return NotFound(new { message = "Không tìm thấy người dùng." });

            return Ok(result);
        }

        [HttpPut("{id}/role")]
        public IActionResult UpdateRole(int id, UpdateUserRoleDto dto)
        {
            var result = _userService.UpdateRole(id, dto);

            if (!result)
            {
                return NotFound(new { message = "Không tìm thấy người dùng." });
            }

            return Ok(new { message = "Cập nhật vai trò thành công." });
        }
    }
}
