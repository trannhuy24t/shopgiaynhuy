export type Role = 'Admin' | 'Staff' | 'Tenant' | 'User';

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: Role;
}
