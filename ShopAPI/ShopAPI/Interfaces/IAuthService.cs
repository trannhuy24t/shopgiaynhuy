using ShopAPI.DTOs;

namespace ShopAPI.Interfaces
{
    public interface IAuthService
    {
        AuthResponseDto Register(RegisterDto dto);

        AuthResponseDto Login(LoginDto dto);

        AuthResponseDto RefreshToken(RefreshTokenDto dto);

        (bool Success, string Message) ChangePassword(int userId, ChangePasswordDto dto);
    }
}