namespace ShopAPI.DTOs
{
    public class AuthResponseDto
    {
        public bool Success { get; set; }

        public string Message { get; set; } = string.Empty;

        public string? Token { get; set; }

        public string? RefreshToken { get; set; }

        public object? User { get; set; }
    }

    public class RefreshTokenDto
    {
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
    }
}