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
  buildingAddress?: string | null;
  ownerPhone?: string | null;
  roomNumber: string;
  roomType?: string | null;
  area: number;
  price: number;
  serviceFee: number;
  status: RoomStatus;
  amenities?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  image?: string | null;
  images?: string[];
  createdAt: string;
  media: RoomMediaDto[];
  currentOccupants: number | null;
}

export interface CreateRoomPayload {
  buildingId: number;
  roomNumber: string;
  roomType?: string | null;
  area?: number;
  price: number;
  serviceFee?: number;
  amenities?: string | null;
  description?: string | null;
  imageUrl?: string | null;
}

export interface UpdateRoomPayload {
  id: number;
  roomNumber: string;
  roomType?: string | null;
  area?: number;
  price: number;
  serviceFee?: number;
  amenities?: string | null;
  description?: string | null;
  imageUrl?: string | null;
}

export interface UpdateRoomStatusPayload {
  id: number;
  status: RoomStatus;
}
