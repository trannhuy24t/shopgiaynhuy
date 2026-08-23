using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopAPI.Interfaces;

namespace ShopAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class ReportController : ControllerBase
    {
        private readonly IReportService _reportService;

        public ReportController(IReportService reportService)
        {
            _reportService = reportService;
        }

        [HttpGet("dashboard")]
        public IActionResult GetDashboard()
        {
            var result = _reportService.GetDashboard();

            return Ok(result);
        }

        [HttpGet("logs")]
        public IActionResult GetLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var result = _reportService.GetLogs(page, pageSize);

            return Ok(result);
        }
    }
}
