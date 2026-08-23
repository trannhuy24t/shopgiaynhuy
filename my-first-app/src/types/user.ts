import type { Role } from './auth';

export interface UserDto {
  id: number;
  fullName: string;
  email: string;
  role: Role;
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
