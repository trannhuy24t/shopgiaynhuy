using System.Net;
using System.Text.Json;

namespace ShopAPI.Middleware
{
    public class ExceptionHandlerMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlerMiddleware> _logger;
        private readonly IWebHostEnvironment _env;

        public ExceptionHandlerMiddleware(RequestDelegate next, ILogger<ExceptionHandlerMiddleware> logger, IWebHostEnvironment env)
        {
            _next = next;
            _logger = logger;
            _env = env;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled exception at {Method} {Path}", context.Request.Method, context.Request.Path);
                await HandleExceptionAsync(context, ex);
            }
        }

        private Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";

            var (statusCode, message) = exception switch
            {
                UnauthorizedAccessException => (HttpStatusCode.Unauthorized, "Không có quyền truy cập."),
                KeyNotFoundException => (HttpStatusCode.NotFound, "Không tìm thấy dữ liệu."),
                ArgumentException => (HttpStatusCode.BadRequest, exception.Message),
                InvalidOperationException => (HttpStatusCode.BadRequest, exception.Message),
                _ => (HttpStatusCode.InternalServerError, "Lỗi hệ thống, vui lòng thử lại sau.")
            };

            context.Response.StatusCode = (int)statusCode;

            var response = new Dictionary<string, object>
            {
                ["message"] = message
            };

            // Chỉ expose chi tiết lỗi ở môi trường Development
            if (_env.IsDevelopment() && statusCode == HttpStatusCode.InternalServerError)
            {
                response["detail"] = exception.Message;
                response["stackTrace"] = exception.StackTrace ?? "";
            }

            return context.Response.WriteAsJsonAsync(response);
        }
    }
}
