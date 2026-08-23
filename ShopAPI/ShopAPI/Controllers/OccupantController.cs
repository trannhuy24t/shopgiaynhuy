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
    public class OccupantController : ControllerBase
    {
        private readonly IContractService _contractService;

        public OccupantController(IContractService contractService)
        {
            _contractService = contractService;
        }

        private int GetUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        }

        private bool CanManage(int occupantId)
        {
            var isStaffOrAdmin = User.IsInRole("Admin") || User.IsInRole("Staff");

            return isStaffOrAdmin || _contractService.IsOccupantOwnedByUser(occupantId, GetUserId());
        }

        [HttpPut("{id}")]
        public IActionResult Update(int id, UpdateOccupantDto dto)
        {
            if (!CanManage(id))
            {
                return Forbid();
            }

            var (occupant, error) = _contractService.UpdateOccupant(id, dto, GetUserId());

            if (occupant == null)
            {
                return NotFound(new { message = error ?? "Không tìm thấy người ở cùng." });
            }

            return Ok(occupant);
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            if (!CanManage(id))
            {
                return Forbid();
            }

            var result = _contractService.RemoveOccupant(id, GetUserId());

            if (!result)
            {
                return NotFound(new { message = "Không tìm thấy người ở cùng." });
            }

            return Ok(new { message = "Đã xóa người ở cùng." });
        }
    }
}
