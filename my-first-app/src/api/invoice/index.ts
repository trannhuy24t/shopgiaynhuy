import api from "../client";
import type { InvoiceDto, CreateInvoicePayload } from "../../types/invoice";

// Staff, Admin — tạo hóa đơn hàng tháng
export const createInvoice = (data: CreateInvoicePayload) => {
    return api.post<InvoiceDto>("/Invoice", data);
};

// Tenant — hóa đơn của tôi
export const getMyInvoices = () => {
    return api.get<InvoiceDto[]>("/Invoice/my");
};

// Staff, Admin — toàn bộ hóa đơn, lọc theo trạng thái/hợp đồng
export const getInvoices = (params?: { status?: string; contractId?: number }) => {
    return api.get<InvoiceDto[]>("/Invoice", { params });
};

// Xem chi tiết 1 hóa đơn (BE tự kiểm tra quyền sở hữu nếu không phải Admin/Staff)
export const getInvoice = (id: number) => {
    return api.get<InvoiceDto>(`/Invoice/${id}`);
};
