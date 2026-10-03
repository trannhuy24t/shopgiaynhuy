using ShopAPI.DTOs;

namespace ShopAPI.Interfaces
{
    public interface IUserService
    {
        List<UserDto> GetAll(string? role);

        UserDto? GetById(int id);

        UserDto? CreateStaff(CreateStaffDto dto);

        UserDto? CreateTenantAccount(CreateTenantAccountDto dto);

        bool UpdateRole(int id, UpdateUserRoleDto dto);

        UserDto? UpdateProfile(int userId, UpdateProfileDto dto);
    }
}
