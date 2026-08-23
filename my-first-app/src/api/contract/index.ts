import api from "../client";
import type {
    ContractDto,
    RequestContractPayload,
    ApproveContractPayload,
    RejectContractPayload,
    SetContractUnitPricePayload,
} from "../../types/contract";
import type { ApiMessageResponse } from "../../types/common";

// Tenant — đăng ký thuê phòng
export const requestContract = (data: RequestContractPayload) => {
    return api.post<ContractDto>("/Contract/request", data);
};

// Tenant — hợp đồng của chính mình
export const getMyContracts = () => {
    return api.get<ContractDto[]>("/Contract/my");
};

// Admin, Staff — toàn bộ hợp đồng, lọc theo trạng thái
export const getContracts = (status?: string) => {
    return api.get<ContractDto[]>("/Contract", { params: status ? { status } : undefined });
};

// Xem chi tiết 1 hợp đồng (BE tự kiểm tra quyền sở hữu nếu không phải Admin/Staff)
export const getContract = (id: number) => {
    return api.get<ContractDto>(`/Contract/${id}`);
};

// Admin — duyệt hợp đồng (tự tạo hóa đơn cọc)
export const approveContract = (id: number, data: ApproveContractPayload) => {
    return api.put<ApiMessageResponse>(`/Contract/${id}/approve`, data);
};

// Admin — từ chối hợp đồng
export const rejectContract = (id: number, data: RejectContractPayload) => {
    return api.put<ApiMessageResponse>(`/Contract/${id}/reject`, data);
};

// Admin, Staff — kết thúc hợp đồng
export const terminateContract = (id: number) => {
    return api.put<ApiMessageResponse>(`/Contract/${id}/terminate`, {});
};

// Admin — gán/sửa đơn giá điện/nước cho hợp đồng đang hiệu lực (không cần qua lại approve),
// dùng để chốt giá cho hợp đồng cũ chưa có. Tự động thông báo cho Tenant khi thành công.
export const setContractUnitPrice = (id: number, data: SetContractUnitPricePayload) => {
    return api.put<ApiMessageResponse>(`/Contract/${id}/set-unit-price`, data);
};
