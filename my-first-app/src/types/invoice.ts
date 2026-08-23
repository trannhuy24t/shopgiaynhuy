export type InvoiceStatus = 'ChuaThanhToan' | 'DaThanhToan' | 'QuaHan';
export type InvoiceType = 'Coc' | 'HangThang';

export interface InvoiceItemDto {
  itemName: string;
  amount: number;
}

export interface InvoiceDto {
  id: number;
  contractId: number;
  roomNumber?: string | null;
  tenantName?: string | null;
  month: number;
  year: number;
  electricOldReading: number;
  electricNewReading: number;
  electricUsage: number;
  electricUnitPrice: number;
  waterOldReading: number;
  waterNewReading: number;
  waterUsage: number;
  waterUnitPrice: number;
  totalAmount: number;
  type: InvoiceType;
  status: InvoiceStatus;
  dueDate: string;
  createdAt: string;
  items: InvoiceItemDto[];
}

export interface CreateInvoicePayload {
  contractId: number;
  month: number;
  year: number;
  electricOldReading?: number;
  electricNewReading?: number;
  electricUnitPrice?: number;
  waterOldReading?: number;
  waterNewReading?: number;
  waterUnitPrice?: number;
  serviceFee?: number;
  dueDate: string;
}
