import api from "../client";
import type {
    MaintenanceRequestDto,
    CreateMaintenanceRequestPayload,
    AssignMaintenancePayload,
    UpdateMaintenanceStatusPayload,
} from "../../types/maintenance";
import type { ApiMessageResponse } from "../../types/common";

// Tenant — gửi yêu cầu bảo trì (chỉ nhập link ảnh, không upload file)
export const createMaintenanceRequest = (data: CreateMaintenanceRequestPayload) => {
    return api.post<MaintenanceRequestDto>("/Maintenance", data);
};

export interface CreateMaintenanceRequestWithImagePayload {
    roomId: number;
    title: string;
    description?: string | null;
    priority?: string;
    image?: File | null;
}

// Tenant — gửi yêu cầu bảo trì kèm upload ảnh (multipart/form-data)
export const createMaintenanceRequestWithImage = (data: CreateMaintenanceRequestWithImagePayload) => {
    const formData = new FormData();
    formData.append("roomId", String(data.roomId));
    formData.append("title", data.title);
    if (data.description) formData.append("description", data.description);
    if (data.priority) formData.append("priority", data.priority);
    if (data.image) formData.append("image", data.image);

    return api.post<MaintenanceRequestDto>("/Maintenance/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
};

// Tenant — yêu cầu của tôi
export const getMyMaintenanceRequests = () => {
    return api.get<MaintenanceRequestDto[]>("/Maintenance/my");
};

// Staff, Admin — toàn bộ yêu cầu, lọc theo trạng thái
export const getMaintenanceRequests = (status?: string) => {
    return api.get<MaintenanceRequestDto[]>("/Maintenance", { params: status ? { status } : undefined });
};

export const getMaintenanceRequest = (id: number) => {
    return api.get<MaintenanceRequestDto>(`/Maintenance/${id}`);
};

// Staff, Admin — phân công xử lý
export const assignMaintenanceRequest = (id: number, data: AssignMaintenancePayload) => {
    return api.put<ApiMessageResponse>(`/Maintenance/${id}/assign`, data);
};

// Staff, Admin — cập nhật trạng thái xử lý
export const updateMaintenanceStatus = (id: number, data: UpdateMaintenanceStatusPayload) => {
    return api.put<ApiMessageResponse>(`/Maintenance/${id}/status`, data);
};
