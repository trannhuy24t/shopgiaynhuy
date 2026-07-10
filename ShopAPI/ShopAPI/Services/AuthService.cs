using ShopAPI.Data;
using ShopAPI.DTOs;
using ShopAPI.Interfaces;
using ShopAPI.Models;

namespace ShopAPI.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly JwtService _jwtService;

        public AuthService(AppDbContext context, JwtService jwtService)
        {
            _context = context;
            _jwtService = jwtService;
        }

        public AuthResponseDto Register(RegisterDto dto)
        {
            var existUser = _context.Users
                .FirstOrDefault(x => x.Email == dto.Email);

            if (existUser != null)
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Email đã tồn tại!"
                };
            }

            var user = new User
            {
                FullName = dto.FullName,
                Email = dto.Email,
                Password = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = "User",
                CreatedAt = DateTime.Now
            };

            _context.Users.Add(user);
            _context.SaveChanges();

            return new AuthResponseDto
            {
                Success = true,
                Message = "Đăng ký thành công!"
            };
        }

        public AuthResponseDto Login(LoginDto dto)
        {
            var user = _context.Users
                .FirstOrDefault(x => x.Email == dto.Email);

            if (user == null)
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Email không tồn tại!"
                };
            }

            bool checkPassword = BCrypt.Net.BCrypt.Verify(
                dto.Password,
                user.Password
            );

            if (!checkPassword)
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Mật khẩu không đúng!"
                };
            }

            var token = _jwtService.GenerateToken(user);

            return new AuthResponseDto
            {
                Success = true,
                Message = "Đăng nhập thành công!",
                Token = token,
                User = new
                {
                    user.Id,
                    user.FullName,
                    user.Email,
                    user.Role
                }
            };
        }
    }
}