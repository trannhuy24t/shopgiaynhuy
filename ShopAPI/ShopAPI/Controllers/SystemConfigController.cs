using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopAPI.DTOs;
using ShopAPI.Interfaces;

namespace ShopAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class SystemConfigController : ControllerBase
    {
        private readonly ISystemConfigService _systemConfigService;

        public SystemConfigController(ISystemConfigService systemConfigService)
        {
            _systemConfigService = systemConfigService;
        }

        [HttpGet]
        public IActionResult GetAll()
        {
            var configs = _systemConfigService.GetAll();

            return Ok(configs);
        }

        // Công khai — khách xem phòng/đăng ký thuê cần biết giá điện/nước tham khảo trước khi
        // có hợp đồng để chốt giá thật. Chỉ lộ 2 con số này, không lộ config khác (tài khoản NH...).
        [AllowAnonymous]
        [HttpGet("public-rates")]
        public IActionResult GetPublicRates()
        {
            return Ok(_systemConfigService.GetPublicRates());
        }

        [HttpPut]
        public IActionResult Upsert(UpsertSystemConfigDto dto)
        {
            var config = _systemConfigService.Upsert(dto);

            return Ok(config);
        }
    }
}
