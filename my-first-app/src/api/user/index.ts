import api from "../client";
import type { UserDto, CreateStaffPayload, CreateTenantAccountPayload, UpdateUserRolePayload } from "../../types/user";
import type { ApiMessageResponse } from "../../types/common";

// Admin — danh sách người dùng, lọc theo role
export const getUsers = (role?: string) => {
    return api.get<UserDto[]>("/User", { params: role ? { role } : undefined });
};

export const getUser = (id: number) => {
    return api.get<UserDto>(`/User/${id}`);
};

// Admin — tạo tài khoản nhân viên mới
export const createStaff = (data: CreateStaffPayload) => {
    return api.post<UserDto>("/User/staff", data);
};

// Admin — tạo tài khoản khách thuê mới (role mặc định Tenant, chưa có hồ sơ Tenant —
// khách tự điền hồ sơ ở /ho-so hoặc khi đăng ký thuê phòng)
export const createTenantAccount = (data: CreateTenantAccountPayload) => {
    return api.post<UserDto>("/User/tenant", data);
};

// Admin — đổi role người dùng (VD: User -> Tenant/Staff)
export const updateUserRole = (id: number, data: UpdateUserRolePayload) => {
    return api.put<ApiMessageResponse>(`/User/${id}/role`, data);
};
