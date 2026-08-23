import api from "../client";
import type { NotificationDto, CreateNotificationPayload } from "../../types/notification";
import type { ApiMessageResponse } from "../../types/common";

// Staff, Admin — gửi thông báo cho 1 khách thuê cụ thể (theo userId)
export const createNotification = (data: CreateNotificationPayload) => {
    return api.post<NotificationDto>("/Notification", data);
};

// Bất kỳ user đã đăng nhập nào — thông báo của tôi
export const getMyNotifications = () => {
    return api.get<NotificationDto[]>("/Notification/my");
};

export const markNotificationRead = (id: number) => {
    return api.put<ApiMessageResponse>(`/Notification/${id}/read`, {});
};

// Staff, Admin — nhắc nợ tự động cho toàn bộ hóa đơn quá hạn
export const remindOverdue = () => {
    return api.post<{ message: string; count: number }>("/Notification/remind-overdue");
};

// Staff, Admin — nhắc hóa đơn ChuaThanhToan sắp tới hạn (DueDate trong N ngày tới),
// gửi cho cả khách thuê lẫn Admin/Staff
export const remindUpcomingInvoices = (daysBefore = 3) => {
    return api.post<{ message: string; count: number }>(
        `/Notification/remind-upcoming-invoices?daysBefore=${daysBefore}`
    );
};

// Staff, Admin — nhắc hợp đồng DangHieuLuc sắp hết hạn (EndDate trong N ngày tới),
// gửi cho cả khách thuê lẫn Admin/Staff
export const remindUpcomingContracts = (daysBefore = 7) => {
    return api.post<{ message: string; count: number }>(
        `/Notification/remind-upcoming-contracts?daysBefore=${daysBefore}`
    );
};
