using ShopAPI.Data;
using ShopAPI.DTOs;
using ShopAPI.Interfaces;
using ShopAPI.Models;

namespace ShopAPI.Services
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _context;
        private readonly IActivityLogService _activityLogService;

        public UserService(AppDbContext context, IActivityLogService activityLogService)
        {
            _context = context;
            _activityLogService = activityLogService;
        }

        public List<UserDto> GetAll(string? role)
        {
            var query = _context.Users.AsQueryable();

            if (!string.IsNullOrWhiteSpace(role))
            {
                query = query.Where(u => u.Role == role);
            }

            return query
                .OrderByDescending(u => u.Id)
                .Select(u => MapToDto(u))
                .ToList();
        }

        public UserDto? GetById(int id)
        {
            var user = _context.Users.Find(id);

            return user == null ? null : MapToDto(user);
        }

        public UserDto? CreateStaff(CreateStaffDto dto)
        {
            var exists = _context.Users.Any(u => u.Email == dto.Email);

            if (exists)
            {
                return null;
            }

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                Password = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = "Staff",
                CreatedAt = DateTime.Now
            };

            _context.Users.Add(user);
            _context.SaveChanges();

            _activityLogService.Log(null, "CreateStaff", "User", user.Id, $"Tạo tài khoản nhân viên {user.Email}");

            return MapToDto(user);
        }

        public UserDto? CreateTenantAccount(CreateTenantAccountDto dto)
        {
            var exists = _context.Users.Any(u => u.Email == dto.Email);

            if (exists)
            {
                return null;
            }

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                Password = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = "Tenant",
                CreatedAt = DateTime.Now
            };

            _context.Users.Add(user);
            _context.SaveChanges();

            _activityLogService.Log(null, "CreateTenantAccount", "User", user.Id, $"Tạo tài khoản khách thuê {user.Email}");

            return MapToDto(user);
        }

        public bool UpdateRole(int id, UpdateUserRoleDto dto)
        {
            var user = _context.Users.Find(id);

            if (user == null)
            {
                return false;
            }

            user.Role = dto.Role;
            _context.SaveChanges();

            _activityLogService.Log(null, "UpdateUserRole", "User", user.Id, $"Đổi vai trò thành {dto.Role}");

            return true;
        }

        private static UserDto MapToDto(User user)
        {
            return new UserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                CreatedAt = user.CreatedAt
            };
        }
    }
}
