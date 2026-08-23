import api from "../client";
import type { PaymentDto, ConfirmPaymentPayload, QrPaymentResponseDto } from "../../types/payment";
import type { ApiMessageResponse } from "../../types/common";

// Tenant — lấy mã VietQR để thanh toán 1 hóa đơn
export const getPaymentQr = (invoiceId: number) => {
    return api.get<QrPaymentResponseDto>(`/Payment/qr/${invoiceId}`);
};

// Lịch sử thanh toán của 1 hóa đơn
export const getPaymentsByInvoice = (invoiceId: number) => {
    return api.get<PaymentDto[]>(`/Payment/invoice/${invoiceId}`);
};

// Staff, Admin — xác nhận đã nhận thanh toán (tiền mặt/chuyển khoản/QR)
export const confirmPayment = (data: ConfirmPaymentPayload) => {
    return api.put<ApiMessageResponse>("/Payment/confirm-cash", data);
};
