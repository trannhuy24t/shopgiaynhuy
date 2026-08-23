import api from "../client";
import type { TenantDto, UpsertTenantProfilePayload } from "../../types/tenant";

// Tenant — hồ sơ của chính mình
export const getMyTenantProfile = () => {
    return api.get<TenantDto>("/Tenant/me");
};

export const updateMyTenantProfile = (data: UpsertTenantProfilePayload) => {
    return api.put<TenantDto>("/Tenant/me", data);
};

// Admin, Staff — danh sách khách thuê
export const getTenants = () => {
    return api.get<TenantDto[]>("/Tenant");
};

export const getTenant = (id: number) => {
    return api.get<TenantDto>(`/Tenant/${id}`);
};
