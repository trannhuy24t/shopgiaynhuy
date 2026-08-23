import type { UpsertTenantProfilePayload } from './tenant';

export type ContractStatus = 'ChoDuyet' | 'ChoCoc' | 'DangHieuLuc' | 'DaKetThuc' | 'TuChoi';

export interface OccupantDto {
  id: number;
  contractId: number;
  fullName: string;
  relationship: string;
  idCardNumber: string | null;
  phone: string | null;
  createdAt: string;
}

export interface CreateOccupantPayload {
  fullName: string;
  relationship: string;
  idCardNumber?: string | null;
  phone?: string | null;
}

export interface UpdateOccupantPayload {
  fullName: string;
  relationship: string;
  idCardNumber?: string | null;
  phone?: string | null;
}

export interface ContractDto {
  id: number;
  roomId: number;
  roomNumber?: string | null;
  tenantId: number;
  tenantName?: string | null;
  startDate: string;
  endDate: string;
  deposit: number;
  monthlyRent: number;
  numberOfOccupants: number;
  electricUnitPrice: number;
  waterUnitPrice: number;
  status: ContractStatus;
  createdAt: string;
  occupants: OccupantDto[];
}

export interface RequestContractPayload {
  roomId: number;
  startDate: string;
  endDate: string;
  numberOfOccupants: number;
  tenantProfile: UpsertTenantProfilePayload;
}

export interface ApproveContractPayload {
  deposit: number;
  monthlyRent: number;
  numberOfOccupants: number;
  electricUnitPrice: number;
  waterUnitPrice: number;
  endDate?: string | null;
}

export interface RejectContractPayload {
  reason?: string | null;
}

export interface SetContractUnitPricePayload {
  electricUnitPrice: number;
  waterUnitPrice: number;
}
