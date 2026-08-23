using ShopAPI.DTOs;

namespace ShopAPI.Interfaces
{
    public interface INotificationService
    {
        List<NotificationDto> GetMy(int userId);

        bool MarkRead(int id, int userId);

        NotificationDto Create(CreateNotificationDto dto, int createdByUserId);

        int RemindOverdue(int actorUserId);

        // Nhắc hóa đơn sắp đến hạn thanh toán (chưa quá hạn) — báo cả Tenant lẫn Admin/Staff
        int RemindUpcomingInvoices(int actorUserId, int daysBefore);

        // Nhắc hợp đồng sắp hết hạn — báo cả Tenant lẫn Admin/Staff
        int RemindUpcomingContracts(int actorUserId, int daysBefore);

        // Gửi thông báo tới tất cả user thuộc 1 role (vd: báo Admin/Staff khi Tenant gửi yêu cầu mới)
        void NotifyRole(string role, string title, string content, string type, int? relatedInvoiceId = null, int? relatedContractId = null);
    }
}
