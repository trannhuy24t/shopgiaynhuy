import type { LucideIcon } from 'lucide-react';
import {
  DoorOpen,
  Building2,
  FileText,
  Receipt,
  Wrench,
  Users,
  Settings2,
  BarChart3,
  FileClock,
  UserCircle,
  UserCog,
} from 'lucide-react';
import type { Role } from '../types/auth';

export interface MenuItem {
  label: string;
  path: string;
  icon: LucideIcon;
  roles: Role[];
}

// Menu khu vực quản trị (Sidebar /admin/*) — ẩn hẳn mục không đủ quyền theo role,
// không chỉ disable. SystemConfig/User/Report chỉ Admin (đã xác nhận 403 với Staff qua API thật).
export const adminMenu: MenuItem[] = [
  { label: 'Quản lý phòng', path: '/admin/rooms', icon: DoorOpen, roles: ['Admin', 'Staff'] },
  { label: 'Quản lý tòa nhà', path: '/admin/buildings', icon: Building2, roles: ['Admin'] },
  { label: 'Quản lý hợp đồng', path: '/admin/contracts', icon: FileText, roles: ['Admin', 'Staff'] },
  { label: 'Quản lý hóa đơn', path: '/admin/invoices', icon: Receipt, roles: ['Admin', 'Staff'] },
  { label: 'Quản lý bảo trì', path: '/admin/maintenance', icon: Wrench, roles: ['Admin', 'Staff'] },
  { label: 'Quản lý người dùng', path: '/admin/users', icon: Users, roles: ['Admin'] },
  { label: 'Cấu hình hệ thống', path: '/admin/system-config', icon: Settings2, roles: ['Admin'] },
  { label: 'Dashboard báo cáo', path: '/admin/report', icon: BarChart3, roles: ['Admin'] },
  { label: 'Nhật ký hoạt động', path: '/admin/logs', icon: FileClock, roles: ['Admin'] },
];

// Menu tài khoản Tenant (render trên Header dạng icon)
export const tenantMenu: MenuItem[] = [
  { label: 'Hợp đồng của tôi', path: '/hop-dong-cua-toi', icon: FileText, roles: ['Tenant'] },
  { label: 'Hóa đơn của tôi', path: '/hoa-don-cua-toi', icon: Receipt, roles: ['Tenant'] },
  { label: 'Yêu cầu bảo trì', path: '/yeu-cau-cua-toi', icon: Wrench, roles: ['Tenant'] },
  { label: 'Hồ sơ cá nhân', path: '/ho-so', icon: UserCircle, roles: ['Tenant'] },
  { label: 'Tài khoản', path: '/tai-khoan', icon: UserCog, roles: ['Admin', 'Staff', 'Tenant', 'User'] },
];

export function getMenuForRole(menu: MenuItem[], role: Role | undefined): MenuItem[] {
  if (!role) return [];
  return menu.filter((item) => item.roles.includes(role));
}
