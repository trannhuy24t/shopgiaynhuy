using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ShopAPI.Interfaces;

namespace ShopAPI.Services
{
    public class ZaloService : IZaloService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<ZaloService> _logger;
        private readonly HttpClient _httpClient;

        public ZaloService(IConfiguration configuration, ILogger<ZaloService> logger, HttpClient httpClient)
        {
            _configuration = configuration;
            _logger = logger;
            _httpClient = httpClient;
        }

        public async Task<bool> SendMaintenanceToLandlordAsync(
            string? landlordPhone,
            string? landlordName,
            string roomNumber,
            string? buildingName,
            string tenantName,
            string? tenantPhone,
            string title,
            string? description,
            string priority)
        {
            var priorityText = priority switch
            {
                "Cao" => "🔥 KHẨN CẤP / CAO",
                "TrungBinh" => "⚡ TRUNG BÌNH",
                "Thap" => "🟢 BÌNH THƯỜNG / THẤP",
                _ => priority
            };

            var message = new StringBuilder();
            message.AppendLine($"🔧 [TROHUB] THÔNG BÁO SỰ CỐ BẢO TRÌ MỚI");
            message.AppendLine($"Kính gửi Chủ trọ: {landlordName ?? "Ban Quản lý"}");
            message.AppendLine($"• Phòng: {roomNumber} {(string.IsNullOrWhiteSpace(buildingName) ? "" : $"({buildingName})")}");
            message.AppendLine($"• Khách thuê báo: {tenantName} {(string.IsNullOrWhiteSpace(tenantPhone) ? "" : $"- SĐT: {tenantPhone}")}");
            message.AppendLine($"• Sự cố: {title}");
            message.AppendLine($"• Mức độ ưu tiên: {priorityText}");
            if (!string.IsNullOrWhiteSpace(description))
            {
                message.AppendLine($"• Mô tả chi tiết: {description}");
            }
            message.AppendLine($"• Thời gian: {DateTime.Now:dd/MM/yyyy HH:mm}");
            message.AppendLine($"👉 Vui lòng đăng nhập hệ thống TroHub để phân công nhân viên kỹ thuật.");

            var messageContent = message.ToString();
            _logger.LogInformation("[Zalo Service] Thông báo Chủ trọ ({Phone}):\n{Msg}", landlordPhone ?? "N/A", messageContent);

            return await DispatchZaloAsync(landlordPhone, messageContent);
        }

        public async Task<bool> SendAssignmentToStaffAsync(
            string? staffPhone,
            string? staffName,
            string roomNumber,
            string? buildingName,
            string? buildingAddress,
            string tenantName,
            string? tenantPhone,
            string title,
            string? description,
            string priority,
            string? note)
        {
            var priorityText = priority switch
            {
                "Cao" => "🔥 KHẨN CẤP / CAO",
                "TrungBinh" => "⚡ TRUNG BÌNH",
                "Thap" => "🟢 BÌNH THƯỜNG / THẤP",
                _ => priority
            };

            var message = new StringBuilder();
            message.AppendLine($"🛠️ [TROHUB] PHÂN CÔNG SỬA CHỮA BẢO TRÌ");
            message.AppendLine($"Kính gửi Kỹ thuật viên: {staffName ?? "Nhân viên"}");
            message.AppendLine($"• Địa điểm: Phòng {roomNumber} {(string.IsNullOrWhiteSpace(buildingName) ? "" : $"({buildingName})")}");
            if (!string.IsNullOrWhiteSpace(buildingAddress))
            {
                message.AppendLine($"• Địa chỉ tòa nhà: {buildingAddress}");
            }
            message.AppendLine($"• Khách thuê cần hỗ trợ: {tenantName} {(string.IsNullOrWhiteSpace(tenantPhone) ? "" : $"- SĐT: {tenantPhone}")}");
            message.AppendLine($"• Nội dung sự cố: {title}");
            message.AppendLine($"• Mức độ ưu tiên: {priorityText}");
            if (!string.IsNullOrWhiteSpace(description))
            {
                message.AppendLine($"• Mô tả từ khách: {description}");
            }
            if (!string.IsNullOrWhiteSpace(note))
            {
                message.AppendLine($"• Ghi chú từ Quản lý: {note}");
            }
            message.AppendLine($"• Thời gian giao việc: {DateTime.Now:dd/MM/yyyy HH:mm}");
            message.AppendLine($"👉 Vui lòng liên hệ khách thuê để hẹn lịch kiểm tra và xử lý sự cố sớm nhất.");

            var messageContent = message.ToString();
            _logger.LogInformation("[Zalo Service] Thông báo Nhân viên ({Phone}):\n{Msg}", staffPhone ?? "N/A", messageContent);

            return await DispatchZaloAsync(staffPhone, messageContent);
        }

        private async Task<bool> DispatchZaloAsync(string? phoneNumber, string messageContent)
        {
            var token = _configuration["Zalo:AccessToken"];
            var enabled = _configuration.GetValue<bool>("Zalo:Enabled", true);

            if (!enabled || string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(phoneNumber))
            {
                // Chế độ mô phỏng / Không có token Zalo OA: Đã ghi nhận log thành công
                _logger.LogInformation("[Zalo Simulated] Chế độ miễn phí / mô phỏng: Đã chuẩn bị sẵn nội dung tin nhắn gửi tới số {Phone}", phoneNumber);
                return true;
            }

            try
            {
                // Định dạng số điện thoại chuẩn Việt Nam: 84xxxxxxxxx
                var cleanPhone = phoneNumber.Replace(" ", "").Replace(".", "").Replace("-", "");
                if (cleanPhone.StartsWith("0"))
                {
                    cleanPhone = "84" + cleanPhone[1..];
                }

                // Gửi qua Zalo OA API (khi người dùng có cấu hình tài khoản Zalo Doanh nghiệp)
                var endpoint = _configuration["Zalo:ApiEndpoint"] ?? "https://openapi.zalo.me/v3.0/oa/message/cs";
                var requestBody = new
                {
                    recipient = new { user_id = cleanPhone },
                    message = new { text = messageContent }
                };

                using var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
                request.Headers.Add("access_token", token);
                request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

                using var response = await _httpClient.SendAsync(request);
                var responseString = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("[Zalo Response] Status: {Status}, Content: {Content}", response.StatusCode, responseString);

                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[Zalo Error] Không thể kết nối tới Zalo API, nội dung đã được lưu vào log hệ thống.");
                return false;
            }
        }
    }
}

