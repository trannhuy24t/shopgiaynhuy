export type NotificationType = 'NhacNo' | 'HopDong' | 'BaoTri' | 'ThongBaoChung';

export interface NotificationDto {
  id: number;
  userId: number;
  title: string;
  content: string;
  type: NotificationType;
  isRead: boolean;
  relatedInvoiceId?: number | null;
  relatedContractId?: number | null;
  createdAt: string;
}

export interface CreateNotificationPayload {
  userId: number;
  title: string;
  content: string;
  type?: NotificationType;
}
