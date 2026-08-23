export type PaymentMethod = 'TienMat' | 'ChuyenKhoan' | 'QR';

export interface PaymentDto {
  id: number;
  invoiceId: number;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  transactionRef?: string | null;
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
}
