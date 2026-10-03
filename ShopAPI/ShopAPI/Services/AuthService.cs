using ShopAPI.Data;
using ShopAPI.DTOs;
using ShopAPI.Interfaces;
using ShopAPI.Models;
using System.Security.Claims;

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
                CreatedAt = DateTime.UtcNow
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
            var refreshToken = _jwtService.GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            _context.SaveChanges();

            return new AuthResponseDto
            {
                Success = true,
                Message = "Đăng nhập thành công!",
                Token = token,
                RefreshToken = refreshToken,
                User = new
                {
                    user.Id,
                    user.FullName,
                    user.Email,
                    user.Role,
                    user.PhoneNumber
                }
            };
        }

        public AuthResponseDto RefreshToken(RefreshTokenDto dto)
        {
            var principal = _jwtService.GetPrincipalFromExpiredToken(dto.AccessToken);
            if (principal == null)
            {
                return new AuthResponseDto { Success = false, Message = "AccessToken không hợp lệ!" };
            }

            var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
            {
                return new AuthResponseDto { Success = false, Message = "AccessToken không chứa thông tin User hợp lệ!" };
            }

            var user = _context.Users.FirstOrDefault(u => u.Id == userId);
            if (user == null || user.RefreshToken != dto.RefreshToken || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
            {
                return new AuthResponseDto { Success = false, Message = "RefreshToken không hợp lệ hoặc đã hết hạn!" };
            }

            var newToken = _jwtService.GenerateToken(user);
            var newRefreshToken = _jwtService.GenerateRefreshToken();

            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            _context.SaveChanges();

            return new AuthResponseDto
            {
                Success = true,
                Message = "Làm mới token thành công!",
                Token = newToken,
                RefreshToken = newRefreshToken,
                User = new
                {
                    user.Id,
                    user.FullName,
                    user.Email,
                    user.Role,
                    user.PhoneNumber
                }
            };
        }

        public (bool Success, string Message) ChangePassword(int userId, ChangePasswordDto dto)
        {
            var user = _context.Users.FirstOrDefault(u => u.Id == userId);

            if (user == null)
                return (false, "Người dùng không tồn tại.");

            if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.Password))
                return (false, "Mật khẩu hiện tại không đúng.");

            user.Password = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            _context.SaveChanges();

            return (true, "Đổi mật khẩu thành công.");
        }
    }
}