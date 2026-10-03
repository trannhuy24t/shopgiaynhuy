import type { Role } from './auth';

export interface UserDto {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  phoneNumber?: string | null;
  createdAt: string;
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
}
