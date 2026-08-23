import api from "../client";
import type { RoomDto, RoomMediaDto, CreateRoomPayload, UpdateRoomPayload, UpdateRoomStatusPayload } from "../../types/room";
import type { ApiMessageResponse } from "../../types/common";

// Công khai, không cần đăng nhập — khách xem phòng trống
export const getAvailableRooms = (buildingId?: number) => {
    return api.get<RoomDto[]>("/Room/available", {
        params: buildingId ? { buildingId } : undefined,
    });
};

// Công khai — xem chi tiết 1 phòng
export const getRoom = (id: number | string) => {
    return api.get<RoomDto>(`/Room/${id}`);
};

// Admin, Staff — danh sách đầy đủ, lọc theo tòa nhà/trạng thái
export const getRooms = (params?: { buildingId?: number; status?: string }) => {
    return api.get<RoomDto[]>("/Room", { params });
};

// Admin — tạo phòng (chỉ nhập link ảnh, không upload file)
export const createRoom = (data: CreateRoomPayload) => {
    return api.post<RoomDto>("/Room", data);
};

export interface CreateRoomWithImagePayload {
    buildingId: number;
    roomNumber: string;
    area?: number;
    price: number;
    serviceFee?: number;
    description?: string | null;
    image?: File | null;
}

// Admin — tạo phòng kèm upload ảnh (multipart/form-data)
export const createRoomWithImage = (data: CreateRoomWithImagePayload) => {
    const formData = new FormData();
    formData.append("buildingId", String(data.buildingId));
    formData.append("roomNumber", data.roomNumber);
    if (data.area !== undefined) formData.append("area", String(data.area));
    formData.append("price", String(data.price));
    if (data.serviceFee !== undefined) formData.append("serviceFee", String(data.serviceFee));
    if (data.description) formData.append("description", data.description);
    if (data.image) formData.append("image", data.image);

    return api.post<RoomDto>("/Room/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
};

// Admin — sửa phòng (chỉ đổi field, không đổi ảnh — giữ lại cho các nơi không cần đổi ảnh)
export const updateRoom = (data: UpdateRoomPayload) => {
    return api.put<ApiMessageResponse>("/Room", data);
};

export interface UpdateRoomWithImagePayload {
    id: number;
    roomNumber: string;
    area?: number;
    price: number;
    serviceFee?: number;
    description?: string | null;
    image?: File | null;
}

// Admin — sửa phòng kèm upload ảnh mới (multipart/form-data). Không gửi field image thì backend
// tự giữ nguyên ảnh cũ — không cần tự truyền lại imageUrl như endpoint JSON ở trên.
export const updateRoomWithImage = (data: UpdateRoomWithImagePayload) => {
    const formData = new FormData();
    formData.append("roomNumber", data.roomNumber);
    if (data.area !== undefined) formData.append("area", String(data.area));
    formData.append("price", String(data.price));
    if (data.serviceFee !== undefined) formData.append("serviceFee", String(data.serviceFee));
    if (data.description) formData.append("description", data.description);
    if (data.image) formData.append("image", data.image);

    return api.put<RoomDto>(`/Room/${data.id}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
};

// Admin, Staff — đổi trạng thái phòng
export const updateRoomStatus = (data: UpdateRoomStatusPayload) => {
    return api.put<ApiMessageResponse>("/Room/status", data);
};

// Admin — xóa phòng
export const deleteRoom = (id: number) => {
    return api.delete<ApiMessageResponse>(`/Room/${id}`);
};

// Admin — thêm nhiều ảnh/video vào thư viện của phòng (multipart, field "files" lặp lại).
// Ảnh đầu tiên tự thành ảnh đại diện nếu phòng chưa có ảnh nào. Trả về toàn bộ danh sách media.
export const addRoomMedia = (roomId: number, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    return api.post<RoomMediaDto[]>(`/Room/${roomId}/media`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
};

// Admin — xóa 1 ảnh/video khỏi thư viện
export const removeRoomMedia = (roomId: number, mediaId: number) => {
    return api.delete<ApiMessageResponse>(`/Room/${roomId}/media/${mediaId}`);
};

// Admin — đặt 1 ảnh trong thư viện làm ảnh đại diện
export const setPrimaryRoomMedia = (roomId: number, mediaId: number) => {
    return api.put<ApiMessageResponse>(`/Room/${roomId}/media/${mediaId}/primary`, {});
};
