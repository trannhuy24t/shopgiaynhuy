import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { User, LogOut, ShieldCheck, Home as HomeIcon, DoorOpen } from 'lucide-react';
import NotificationDropdown from './components/Common/NotificationDropdown';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import { NotificationCountProvider } from './context/NotificationContext';
import type { Role } from './types/auth';
import { tenantMenu, getMenuForRole } from './constants/menuConfig';

// Pages
import Home from './features/home/HomePage';
import Login from './features/auth/LoginPage';

// Rental pages (nhóm Room + Building)
import RoomListPage from './features/room/RoomListPage';
import RoomDetailPage from './features/room/RoomDetailPage';
import ContractRequestPage from './features/contract/ContractRequestPage';
import RoomManagerPage from './features/admin/rooms/RoomManagerPage';
import BuildingManagerPage from './features/admin/buildings/BuildingManagerPage';

// Rental pages (nhóm Auth/Tenant profile)
import TenantProfilePage from './features/tenant/TenantProfilePage';

// Rental pages (nhóm Contract)
import MyContractsPage from './features/contract/MyContractsPage';
import ContractManagerPage from './features/admin/contracts/ContractManagerPage';

// Rental pages (nhóm Invoice + Payment)
import MyInvoicesPage from './features/invoice/MyInvoicesPage';
import InvoiceManagerPage from './features/admin/invoices/InvoiceManagerPage';
import InvoiceCreatePage from './features/admin/invoices/InvoiceCreatePage';

// Rental pages (nhóm Maintenance)
import MaintenanceRequestPage from './features/maintenance/MaintenanceRequestPage';
import MyMaintenanceRequestsPage from './features/maintenance/MyMaintenanceRequestsPage';
import MaintenanceManagerPage from './features/admin/maintenance/MaintenanceManagerPage';

// Rental pages (nhóm Notification)
import NotificationsPage from './features/notification/NotificationsPage';

// Rental pages (nhóm User/SystemConfig/Report) — khu vực Admin, dùng chung AdminLayout (sidebar)
import AdminLayout, { AdminIndexRedirect } from './features/admin/AdminLayout';
import UserManagerPage from './features/admin/users/UserManagerPage';
import SystemConfigPage from './features/admin/systemConfig/SystemConfigPage';
import ReportDashboardPage from './features/admin/report/ReportDashboardPage';
import ActivityLogPage from './features/admin/report/ActivityLogPage';

// Component bảo vệ Route dành cho User đăng nhập (bất kỳ role nào)
const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Component bảo vệ Route theo danh sách role được phép (dùng cho các trang nhà trọ:
// Admin/Staff/Tenant có quyền khác nhau ở từng trang)
const RoleRoute = ({ children, roles }: { children: ReactNode; roles: Role[] }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role)) {
    alert('Bạn không có quyền truy cập chức năng này!');
    return <Navigate to="/" replace />;
  }

  return children;
};

// Component Navbar dùng chung cho toàn trang
const Header = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const myMenu = getMenuForRole(tenantMenu, user?.role);

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center max-w-7xl">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 text-2xl font-black tracking-wider text-orange-500 hover:text-orange-400 transition-colors">
          <span className="bg-orange-500 text-white px-2.5 py-1 rounded-lg text-lg font-bold shadow-lg shadow-orange-500/35 mr-1">T</span>
          TROHUB
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex space-x-8 text-sm font-medium tracking-wide">
          <Link to="/" className="hover:text-orange-500 transition-colors flex items-center gap-1.5 py-1">
            <HomeIcon size={16} /> Trang chủ
          </Link>
          <Link to="/rooms" className="hover:text-orange-500 transition-colors flex items-center gap-1.5 py-1">
            <DoorOpen size={16} /> Danh sách phòng
          </Link>
        </nav>

        {/* User Actions */}
        <div className="flex items-center space-x-5">
          {/* Admin/Staff Link -> vào sidebar quản trị, tự chuyển tới mục đầu tiên được phép xem */}
          {(isAdmin || user?.role === 'Staff') && (
            <Link to="/admin" className="text-orange-400 hover:text-orange-300 font-semibold text-xs flex items-center gap-1 bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20 transition-all duration-300">
              <ShieldCheck size={14} /> Trang quản trị
            </Link>
          )}

          {/* User Account / Login */}
          {user ? (
            <div className="flex items-center space-x-3 border-l border-slate-700 pl-4">
              <NotificationDropdown />
              {myMenu.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`p-2 rounded-full transition-all ${
                      active ? 'text-orange-500 bg-slate-800' : 'text-slate-300 hover:text-orange-500 hover:bg-slate-800'
                    }`}
                    title={item.label}
                  >
                    <Icon className="w-5 h-5" />
                  </Link>
                );
              })}
              <div className="hidden lg:block text-left">
                <p className="text-[10px] text-slate-400 font-semibold leading-none">Xin chào,</p>
                <p className="text-xs font-bold max-w-[100px] truncate mt-0.5">{user.fullName}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-full transition-all cursor-pointer"
                title="Đăng xuất"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-xl text-xs font-bold tracking-wide shadow-lg shadow-orange-500/25 transition-all active:scale-95"
            >
              <User className="w-3.5 h-3.5" /> Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

// Component Footer dùng chung
const Footer = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 pt-16 pb-8 border-t border-slate-900">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-10 max-w-7xl">
        <div className="md:col-span-2">
          <Link to="/" className="text-2xl font-black tracking-wider text-orange-500 hover:text-orange-400 transition-colors block mb-4">
            TROHUB
          </Link>
          <p className="text-sm leading-relaxed mb-6 max-w-sm">
            Nền tảng quản lý nhà trọ, chung cư mini — theo dõi phòng trống, hợp đồng, hóa đơn và bảo trì trên cùng một hệ thống.
          </p>
          <p className="text-xs text-slate-500">© 2026 TroHub. All rights reserved.</p>
        </div>
        <div>
          <h4 className="text-white font-bold text-base mb-4 tracking-wider uppercase">Liên kết nhanh</h4>
          <ul className="space-y-3 text-sm">
            <li><Link to="/" className="hover:text-white transition-colors">Trang chủ</Link></li>
            <li><Link to="/rooms" className="hover:text-white transition-colors">Danh sách phòng</Link></li>
            <li><Link to="/login" className="hover:text-white transition-colors">Đăng nhập</Link></li>
          </ul>
        </div>
        <div id="lien-he">
          <h4 className="text-white font-bold text-base mb-4 tracking-wider uppercase">Liên hệ tư vấn</h4>
          <ul className="space-y-3 text-sm">
            <li className="text-slate-300">Hotline: 1900 8198</li>
            <li className="text-slate-300">Email: support@trohub.vn</li>
            <li className="text-slate-300">Địa chỉ: 123 Đường Ba Tháng Hai, Quận 10, TP. Hồ Chí Minh</li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

function App() {
  return (
    <AuthProvider>
      <NotificationCountProvider>
      <Router>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
          <Header />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />

              {/* Nhà trọ: danh sách/chi tiết phòng trống (công khai) */}
              <Route path="/rooms" element={<RoomListPage />} />
              <Route path="/rooms/:id" element={<RoomDetailPage />} />
              <Route
                path="/thue/:roomId"
                element={
                  <RoleRoute roles={['Tenant']}>
                    <ContractRequestPage />
                  </RoleRoute>
                }
              />

              {/* Tenant */}
              <Route
                path="/ho-so"
                element={
                  <RoleRoute roles={['Tenant']}>
                    <TenantProfilePage />
                  </RoleRoute>
                }
              />
              <Route
                path="/hop-dong-cua-toi"
                element={
                  <RoleRoute roles={['Tenant']}>
                    <MyContractsPage />
                  </RoleRoute>
                }
              />
              <Route
                path="/hoa-don-cua-toi"
                element={
                  <RoleRoute roles={['Tenant']}>
                    <MyInvoicesPage />
                  </RoleRoute>
                }
              />
              <Route
                path="/yeu-cau-bao-tri/moi"
                element={
                  <RoleRoute roles={['Tenant']}>
                    <MaintenanceRequestPage />
                  </RoleRoute>
                }
              />
              <Route
                path="/yeu-cau-cua-toi"
                element={
                  <RoleRoute roles={['Tenant']}>
                    <MyMaintenanceRequestsPage />
                  </RoleRoute>
                }
              />

              {/* Bất kỳ user đã đăng nhập nào */}
              <Route
                path="/thong-bao"
                element={
                  <PrivateRoute>
                    <NotificationsPage />
                  </PrivateRoute>
                }
              />

              {/* Khu vực quản trị (Admin, Staff) — dùng chung AdminLayout (sidebar theo role) */}
              <Route
                path="/admin"
                element={
                  <RoleRoute roles={['Admin', 'Staff']}>
                    <AdminLayout />
                  </RoleRoute>
                }
              >
                <Route index element={<AdminIndexRedirect />} />
                <Route path="rooms" element={<RoomManagerPage />} />
                <Route path="contracts" element={<ContractManagerPage />} />
                <Route path="invoices" element={<InvoiceManagerPage />} />
                <Route path="invoices/tao-moi" element={<InvoiceCreatePage />} />
                <Route path="maintenance" element={<MaintenanceManagerPage />} />
                <Route
                  path="buildings"
                  element={
                    <RoleRoute roles={['Admin']}>
                      <BuildingManagerPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="users"
                  element={
                    <RoleRoute roles={['Admin']}>
                      <UserManagerPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="system-config"
                  element={
                    <RoleRoute roles={['Admin']}>
                      <SystemConfigPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="report"
                  element={
                    <RoleRoute roles={['Admin']}>
                      <ReportDashboardPage />
                    </RoleRoute>
                  }
                />
                <Route
                  path="logs"
                  element={
                    <RoleRoute roles={['Admin']}>
                      <ActivityLogPage />
                    </RoleRoute>
                  }
                />
              </Route>

              {/* Fallback - Điều hướng về trang chủ */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </Router>
      </NotificationCountProvider>
    </AuthProvider>
  );
}

export default App;
