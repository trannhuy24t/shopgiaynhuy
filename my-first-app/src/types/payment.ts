export type PaymentMethod = 'TienMat' | 'ChuyenKhoan' | 'QR';
export type PaymentStatus = 'ChoXacNhan' | 'DaXacNhan' | 'TuChoi';

export interface PaymentDto {
  id: number;
  invoiceId: number;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  transactionRef?: string | null;
  status: PaymentStatus;
}

export interface ConfirmPaymentPayload {
  invoiceId: number;
  amount: number;
  method: PaymentMethod;
  transactionRef?: string | null;
}

export interface QrPaymentResponseDto {
  invoiceId: number;
  amount: number;
  payload: string;
  isAvailable: boolean;
  message?: string | null;
}

export interface SubmitTransferPayload {
  invoiceId: number;
  amount: number;
  transactionRef: string;
}
