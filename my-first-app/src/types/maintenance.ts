export type MaintenancePriority = 'Thap' | 'TrungBinh' | 'Cao';
export type MaintenanceStatus = 'Moi' | 'DaPhanCong' | 'DangXuLy' | 'HoanThanh' | 'DaHuy';

export interface MaintenanceRequestDto {
  id: number;
  roomId: number;
  roomNumber?: string | null;
  tenantId: number;
  tenantName?: string | null;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  assignedToUserId?: number | null;
  assignedToUserName?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  note?: string | null;
}

export interface CreateMaintenanceRequestPayload {
  roomId: number;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  priority?: MaintenancePriority;
}

export interface AssignMaintenancePayload {
  assignedToUserId: number;
}

export interface UpdateMaintenanceStatusPayload {
  status: MaintenanceStatus;
  note?: string | null;
}
