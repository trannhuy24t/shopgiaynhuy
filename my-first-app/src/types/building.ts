export interface BuildingDto {
  id: number;
  name: string;
  address: string;
  ownerId: number;
  ownerName?: string | null;
  description?: string | null;
  roomCount: number;
  createdAt: string;
}

export interface CreateBuildingPayload {
  name: string;
  address: string;
  ownerId: number;
  description?: string | null;
}

export interface UpdateBuildingPayload extends CreateBuildingPayload {
  id: number;
}
