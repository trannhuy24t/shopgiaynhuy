import api from "../client";
import type { OccupantDto, CreateOccupantPayload, UpdateOccupantPayload } from "../../types/contract";
import type { ApiMessageResponse } from "../../types/common";

// Tenant (chủ hợp đồng) hoặc Admin/Staff — danh sách người ở cùng của 1 hợp đồng
export const getContractOccupants = (contractId: number) => {
    return api.get<OccupantDto[]>(`/Contract/${contractId}/occupant`);
};

// Thêm người ở cùng vào hợp đồng đang hiệu lực (tối đa NumberOfOccupants - 1 người)
export const addContractOccupant = (contractId: number, data: CreateOccupantPayload) => {
    return api.post<OccupantDto[]>(`/Contract/${contractId}/occupant`, data);
};

// Sửa 1 người ở cùng — route độc lập ở OccupantController, chỉ cần occupantId
export const updateOccupant = (occupantId: number, data: UpdateOccupantPayload) => {
    return api.put<OccupantDto>(`/Occupant/${occupantId}`, data);
};

// Xóa 1 người ở cùng
export const deleteOccupant = (occupantId: number) => {
    return api.delete<ApiMessageResponse>(`/Occupant/${occupantId}`);
};
