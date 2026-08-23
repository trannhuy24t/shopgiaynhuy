export type RoomStatus = 'Trong' | 'DaThue' | 'DangSua';
export type RoomMediaType = 'Image' | 'Video';

export interface RoomMediaDto {
  id: number;
  url: string;
  type: RoomMediaType;
  sortOrder: number;
}

export interface RoomDto {
  id: number;
  buildingId: number;
  buildingName?: string | null;
  roomNumber: string;
  area: number;
  price: number;
  serviceFee: number;
  status: RoomStatus;
  description?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  media: RoomMediaDto[];
  currentOccupants: number | null;
}

export interface CreateRoomPayload {
  buildingId: number;
  roomNumber: string;
  area?: number;
  price: number;
  serviceFee?: number;
  description?: string | null;
  imageUrl?: string | null;
}

export interface UpdateRoomPayload {
  id: number;
  roomNumber: string;
  area?: number;
  price: number;
  serviceFee?: number;
  description?: string | null;
  imageUrl?: string | null;
}

export interface UpdateRoomStatusPayload {
  id: number;
  status: RoomStatus;
}
