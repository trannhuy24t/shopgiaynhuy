import type { UpsertTenantProfilePayload } from './tenant';

export type ContractStatus = 'ChoDuyet' | 'ChoCoc' | 'DangHieuLuc' | 'DaKetThuc' | 'TuChoi' | 'DaHuy';

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
  roomArea?: number;
  roomServiceFee?: number;
  buildingName?: string | null;
  buildingAddress?: string | null;
  landlordName?: string | null;
  landlordPhone?: string | null;
  roomImageUrl?: string | null;
  image?: string | null;
  roomImages?: string[];
  tenantId: number;
  tenantName?: string | null;
  tenantPhone?: string | null;
  tenantIdCard?: string | null;
  tenantEmail?: string | null;
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

  // Chữ ký số / Chữ ký điện tử
  tenantSignatureUrl?: string | null;
  signedAt?: string | null;
  signatureHash?: string | null;
  landlordSignatureUrl?: string | null;
  landlordSignedAt?: string | null;
}

export interface RequestContractPayload {
  roomId: number;
  startDate: string;
  endDate: string;
  numberOfOccupants: number;
  tenantProfile: UpsertTenantProfilePayload;
  occupants?: CreateOccupantPayload[];
  tenantSignature?: string | null;
}

export interface SignContractPayload {
  signatureBase64: string;
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

export interface ExtendContractPayload {
  endDate: string;
}
