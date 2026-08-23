import type { RoomStatus } from '../types/room';
import type { ContractStatus } from '../types/contract';
import type { InvoiceStatus, InvoiceType } from '../types/invoice';
import type { PaymentMethod } from '../types/payment';
import type { MaintenancePriority, MaintenanceStatus } from '../types/maintenance';
import type { NotificationType } from '../types/notification';

export interface StatusMeta {
  label: string;
  className: string;
}

// Class Tailwind phải viết literal đầy đủ (không ghép chuỗi động) để JIT scan thấy được,
// dùng chung 1 bảng màu badge dạng bg-{color}-500/10 text-{color}-400 border-{color}-500/20
// đã dùng sẵn trong toàn bộ trang hiện có (Dashboard, OrderManager...).
const GREEN = 'bg-green-500/10 text-green-400 border-green-500/20';
const BLUE = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
const AMBER = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
const ORANGE = 'bg-orange-500/10 text-orange-400 border-orange-500/20';
const RED = 'bg-red-500/10 text-red-400 border-red-500/20';
const SLATE = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
const PURPLE = 'bg-purple-500/10 text-purple-400 border-purple-500/20';

const roomStatusMap: Record<RoomStatus, StatusMeta> = {
  Trong: { label: 'Trống', className: GREEN },
  DaThue: { label: 'Đã thuê', className: BLUE },
  DangSua: { label: 'Đang sửa', className: AMBER },
};

const contractStatusMap: Record<ContractStatus, StatusMeta> = {
  ChoDuyet: { label: 'Chờ duyệt', className: AMBER },
  ChoCoc: { label: 'Chờ cọc', className: ORANGE },
  DangHieuLuc: { label: 'Đang hiệu lực', className: GREEN },
  DaKetThuc: { label: 'Đã kết thúc', className: SLATE },
  TuChoi: { label: 'Từ chối', className: RED },
};

const invoiceStatusMap: Record<InvoiceStatus, StatusMeta> = {
  ChuaThanhToan: { label: 'Chưa thanh toán', className: AMBER },
  DaThanhToan: { label: 'Đã thanh toán', className: GREEN },
  QuaHan: { label: 'Quá hạn', className: RED },
};

const invoiceTypeMap: Record<InvoiceType, StatusMeta> = {
  Coc: { label: 'Hóa đơn cọc', className: PURPLE },
  HangThang: { label: 'Hóa đơn hàng tháng', className: BLUE },
};

const paymentMethodMap: Record<PaymentMethod, StatusMeta> = {
  TienMat: { label: 'Tiền mặt', className: GREEN },
  ChuyenKhoan: { label: 'Chuyển khoản', className: BLUE },
  QR: { label: 'QR', className: PURPLE },
};

const maintenancePriorityMap: Record<MaintenancePriority, StatusMeta> = {
  Thap: { label: 'Thấp', className: SLATE },
  TrungBinh: { label: 'Trung bình', className: AMBER },
  Cao: { label: 'Cao', className: RED },
};

const maintenanceStatusMap: Record<MaintenanceStatus, StatusMeta> = {
  Moi: { label: 'Mới', className: BLUE },
  DaPhanCong: { label: 'Đã phân công', className: PURPLE },
  DangXuLy: { label: 'Đang xử lý', className: AMBER },
  HoanThanh: { label: 'Hoàn thành', className: GREEN },
  DaHuy: { label: 'Đã hủy', className: RED },
};

const notificationTypeMap: Record<NotificationType, StatusMeta> = {
  NhacNo: { label: 'Nhắc nợ', className: RED },
  HopDong: { label: 'Hợp đồng', className: BLUE },
  BaoTri: { label: 'Bảo trì', className: AMBER },
  ThongBaoChung: { label: 'Thông báo chung', className: SLATE },
};

export const statusMaps = {
  room: roomStatusMap,
  contract: contractStatusMap,
  invoiceStatus: invoiceStatusMap,
  invoiceType: invoiceTypeMap,
  paymentMethod: paymentMethodMap,
  maintenancePriority: maintenancePriorityMap,
  maintenanceStatus: maintenanceStatusMap,
  notificationType: notificationTypeMap,
} as const;

export type StatusEntity = keyof typeof statusMaps;

const fallbackMeta = (value: string): StatusMeta => ({
  label: value,
  className: SLATE,
});

export function getStatusMeta(entity: StatusEntity, value: string): StatusMeta {
  const map = statusMaps[entity] as Record<string, StatusMeta>;
  return map[value] ?? fallbackMeta(value);
}
