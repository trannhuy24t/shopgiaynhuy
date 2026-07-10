using ShopAPI.DTOs;

namespace ShopAPI.Interfaces
{
    public interface IAuthService
    {
        AuthResponseDto Register(RegisterDto dto);

        AuthResponseDto Login(LoginDto dto);
    }
}