export interface TenantDto {
  id: number;
  userId: number;
  userEmail?: string | null;
  fullName: string;
  idCardNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  emergencyContact?: string | null;
  createdAt: string;
}

export interface UpsertTenantProfilePayload {
  fullName: string;
  idCardNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  emergencyContact?: string | null;
}
