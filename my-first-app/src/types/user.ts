import type { Role } from './auth';

export interface UserDto {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  phoneNumber?: string | null;
  telegramChatId?: string | null;
  createdAt: string;
}

export interface StaffOptionDto {
  id: number;
  fullName: string;
  phoneNumber?: string | null;
}

export interface CreateStaffPayload {
  fullName: string;
  email: string;
  password: string;
}

export interface CreateTenantAccountPayload {
  fullName: string;
  email: string;
  password: string;
}

export interface UpdateUserRolePayload {
  role: Role;
}

export interface UpdateProfilePayload {
  fullName: string;
  phoneNumber?: string | null;
  telegramChatId?: string | null;
}

export interface UpdateUserPayload {
  fullName: string;
  phoneNumber?: string | null;
  telegramChatId?: string | null;
  role: Role;
}
