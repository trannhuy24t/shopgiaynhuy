using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopAPI.DTOs;
using ShopAPI.Interfaces;

namespace ShopAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Staff")]
    public class BuildingController : ControllerBase
    {
        private readonly IBuildingService _buildingService;

        public BuildingController(IBuildingService buildingService)
        {
            _buildingService = buildingService;
        }

        [HttpGet]
        public IActionResult GetAll()
        {
            var buildings = _buildingService.GetAll();

            return Ok(buildings);
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var building = _buildingService.GetById(id);

            if (building == null)
            {
                return NotFound(new { message = "Không tìm thấy tòa nhà." });
            }

            return Ok(building);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public IActionResult Create(CreateBuildingDto dto)
        {
            var building = _buildingService.Create(dto);

            return Ok(building);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut]
        public IActionResult Update(UpdateBuildingDto dto)
        {
            var result = _buildingService.Update(dto);

            if (!result)
            {
                return NotFound(new { message = "Không tìm thấy tòa nhà." });
            }

            return Ok(new { message = "Cập nhật thành công." });
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var result = _buildingService.Delete(id);

            if (!result)
            {
                return NotFound(new { message = "Không tìm thấy tòa nhà." });
            }

            return Ok(new { message = "Xóa thành công." });
        }
    }
}
