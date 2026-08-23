import { getTenant } from '../api/tenant';
import { getContract } from '../api/contract';
import { createNotification } from '../api/notification';
import type { NotificationType } from '../types/notification';

interface NotifyPayload {
  title: string;
  content: string;
  type: NotificationType;
}

// Gửi thông báo cho tài khoản User đứng sau 1 hồ sơ Tenant. Không throw ra ngoài — hành động
// chính (duyệt hợp đồng, xác nhận thanh toán...) đã thành công rồi, gửi thông báo chỉ là phụ,
// lỗi ở đây không nên chặn hay báo lỗi cho Admin/Staff.
export async function notifyTenant(tenantId: number, payload: NotifyPayload): Promise<void> {
  try {
    const tenantRes = await getTenant(tenantId);
    await createNotification({ userId: tenantRes.data.userId, ...payload });
  } catch (err) {
    console.error('Không gửi được thông báo tới khách thuê:', err);
  }
}

// Giống notifyTenant nhưng tra từ contractId (dùng ở Invoice, vì InvoiceDto không có sẵn tenantId).
export async function notifyTenantByContract(contractId: number, payload: NotifyPayload): Promise<void> {
  try {
    const contractRes = await getContract(contractId);
    await notifyTenant(contractRes.data.tenantId, payload);
  } catch (err) {
    console.error('Không gửi được thông báo (qua hợp đồng) tới khách thuê:', err);
  }
}
