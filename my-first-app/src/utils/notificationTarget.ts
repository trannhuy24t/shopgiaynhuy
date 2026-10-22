import type { NotificationDto } from '../types/notification';

export function getNotificationTarget(notification: NotificationDto, isStaff: boolean): string | null {
  if (notification.relatedInvoiceId) {
    return isStaff ? `/admin/invoices?invoiceId=${notification.relatedInvoiceId}` : `/hoa-don-cua-toi#invoice-${notification.relatedInvoiceId}`;
  }
  if (notification.relatedContractId) {
    return isStaff ? `/admin/contracts?contractId=${notification.relatedContractId}` : `/hop-dong-cua-toi#contract-${notification.relatedContractId}`;
  }
  if (notification.type === 'BaoTri') return isStaff ? '/admin/maintenance' : '/yeu-cau-cua-toi';
  return null;
}
