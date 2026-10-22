import api from "../client";
import type { PaymentDto, ConfirmPaymentPayload, QrPaymentResponseDto, SubmitTransferPayload } from "../../types/payment";
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

export const submitTransfer = (data: SubmitTransferPayload) => {
    return api.post<ApiMessageResponse>("/Payment/submit-transfer", data);
};

export const confirmTransfer = (paymentId: number) => {
    return api.put<ApiMessageResponse>(`/Payment/${paymentId}/confirm-transfer`, {});
};

export const rejectTransfer = (paymentId: number) => {
    return api.put<ApiMessageResponse>(`/Payment/${paymentId}/reject-transfer`, {});
};
