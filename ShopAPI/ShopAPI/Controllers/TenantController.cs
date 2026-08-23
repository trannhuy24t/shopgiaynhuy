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
    public class TenantController : ControllerBase
    {
        private readonly ITenantService _tenantService;

        public TenantController(ITenantService tenantService)
        {
            _tenantService = tenantService;
        }

        private int GetUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        }

        [Authorize(Roles = "Admin,Staff")]
        [HttpGet]
        public IActionResult GetAll()
        {
            var tenants = _tenantService.GetAll();

            return Ok(tenants);
        }

        [Authorize(Roles = "Admin,Staff")]
        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var tenant = _tenantService.GetById(id);

            if (tenant == null)
            {
                return NotFound(new { message = "Không tìm thấy hồ sơ khách thuê." });
            }

            return Ok(tenant);
        }

        [Authorize(Roles = "Tenant")]
        [HttpGet("me")]
        public IActionResult GetMe()
        {
            var tenant = _tenantService.GetByUserId(GetUserId());

            if (tenant == null)
            {
                return NotFound(new { message = "Bạn chưa có hồ sơ khách thuê. Vui lòng cập nhật hồ sơ." });
            }

            return Ok(tenant);
        }

        [Authorize(Roles = "Tenant")]
        [HttpPut("me")]
        public IActionResult UpsertMe(UpsertTenantProfileDto dto)
        {
            var tenant = _tenantService.UpsertForUser(GetUserId(), dto);

            return Ok(tenant);
        }
    }
}
