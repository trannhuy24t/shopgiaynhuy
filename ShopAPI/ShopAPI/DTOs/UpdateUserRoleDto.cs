using System.ComponentModel.DataAnnotations;

namespace ShopAPI.DTOs
{
    public class UpdateUserRoleDto
    {
        [Required]
        public string Role { get; set; } = string.Empty; // Admin | Staff | Tenant
    }
}
