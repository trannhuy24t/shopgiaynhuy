import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { User, LogOut, ShieldCheck, Home as HomeIcon, DoorOpen, Menu, X } from 'lucide-react';
import NotificationDropdown from './components/Common/NotificationDropdown';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import { NotificationCountProvider } from './context/NotificationContext';
import type { Role } from './types/auth';
import { tenantMenu, getMenuForRole } from './constants/menuConfig';

// Each route loads on demand so users don't download every admin screen up front.
const Home = lazy(() => import('./features/home/HomePage'));
const Login = lazy(() => import('./features/auth/LoginPage'));
const Register = lazy(() => import('./features/auth/RegisterPage'));
const RoomListPage = lazy(() => import('./features/room/RoomListPage'));
const RoomDetailPage = lazy(() => import('./features/room/RoomDetailPage'));
const ContractRequestPage = lazy(() => import('./features/contract/ContractRequestPage'));
const RoomManagerPage = lazy(() => import('./features/admin/rooms/RoomManagerPage'));
const BuildingManagerPage = lazy(() => import('./features/admin/buildings/BuildingManagerPage'));
const TenantProfilePage = lazy(() => import('./features/tenant/TenantProfilePage'));
const AccountPage = lazy(() => import('./features/account/AccountPage'));
const MyContractsPage = lazy(() => import('./features/contract/MyContractsPage'));
const ContractManagerPage = lazy(() => import('./features/admin/contracts/ContractManagerPage'));
const MyInvoicesPage = lazy(() => import('./features/invoice/MyInvoicesPage'));
const InvoiceManagerPage = lazy(() => import('./features/admin/invoices/InvoiceManagerPage'));
const InvoiceCreatePage = lazy(() => import('./features/admin/invoices/InvoiceCreatePage'));
const InvoiceBulkCreatePage = lazy(() => import('./features/admin/invoices/InvoiceBulkCreatePage'));
const MaintenanceRequestPage = lazy(() => import('./features/maintenance/MaintenanceRequestPage'));
const MyMaintenanceRequestsPage = lazy(() => import('./features/maintenance/MyMaintenanceRequestsPage'));
const MaintenanceManagerPage = lazy(() => import('./features/admin/maintenance/MaintenanceManagerPage'));
const NotificationsPage = lazy(() => import('./features/notification/NotificationsPage'));
const AdminLayout = lazy(() => import('./features/admin/AdminLayout'));
const AdminIndexRedirect = lazy(() => import('./features/admin/AdminLayout').then((module) => ({ default: module.AdminIndexRedirect })));
const UserManagerPage = lazy(() => import('./features/admin/users/UserManagerPage'));
const NotificationManagerPage = lazy(() => import('./features/admin/notifications/NotificationManagerPage'));
const SystemConfigPage = lazy(() => import('./features/admin/systemConfig/SystemConfigPage'));
const ReportDashboardPage = lazy(() => import('./features/admin/report/ReportDashboardPage'));
const ActivityLogPage = lazy(() => import('./features/admin/report/ActivityLogPage'));

const RouteLoadingFallback = () => (
  <div role="status" aria-live="polite" className="min-h-[45vh] flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    <span className="sr-only">Đang tải trang...</span>
  </div>
);

// Component bảo vệ Route dành cho User đăng nhập (bất kỳ role nào)
const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  return isAuthenticated ? children : <Navigate to="/login" replace state={{ from: location }} />;
};

// Component bảo vệ Route theo danh sách role được phép (dùng cho các trang nhà trọ:
// Admin/Staff/Tenant có quyền khác nhau ở từng trang)
const RoleRoute = ({ children, roles }: { children: ReactNode; roles: Role[] }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!roles.includes(user.role)) {
    return (
      <div role="alert" className="container mx-auto max-w-2xl px-4 py-24 text-center">
        <ShieldCheck className="mx-auto mb-5 h-12 w-12 text-orange-400" aria-hidden="true" />
        <h1 className="text-3xl font-black text-white">Bạn không có quyền truy cập</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          Trang này dành cho {roles.join(', ')}. Tài khoản hiện tại của bạn là {user.role}.
        </p>
        <Link to="/" className="mt-6 inline-flex rounded-xl bg-orange-500 px-5 py-3 font-bold text-white hover:bg-orange-600">
          Về trang chủ
        </Link>
      </div>
    );
  }

  return children;
};

// Component Navbar dùng chung cho toàn trang
const Header = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const myMenu = getMenuForRole(tenantMenu, user?.role);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [location.pathname]);

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
        <div className="flex items-center space-x-2 sm:space-x-5">
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-800"
            aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
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
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 py-3 space-y-2">
          <Link to="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"><HomeIcon size={16} /> Trang chủ</Link>
          <Link to="/rooms" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"><DoorOpen size={16} /> Danh sách phòng</Link>
          {user && myMenu.map((item) => {
            const Icon = item.icon;
            return <Link key={item.path} to={item.path} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"><Icon size={16} /> {item.label}</Link>;
          })}
          {(isAdmin || user?.role === 'Staff') && <Link to="/admin" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-orange-300 hover:bg-slate-800"><ShieldCheck size={16} /> Trang quản trị</Link>}
          {!user && <Link to="/login" className="block rounded-lg px-3 py-2 text-sm text-orange-300 hover:bg-slate-800">Đăng nhập</Link>}
        </div>
      )}
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
          <p className="text-sm leading-relaxed">Thông tin hỗ trợ đang được cập nhật. Với phòng cụ thể, hãy xem thông tin liên hệ do chủ trọ cung cấp trên trang chi tiết phòng.</p>
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
            <Suspense fallback={<RouteLoadingFallback />}>
              <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dang-ky" element={<Register />} />

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
                path="/tai-khoan"
                element={
                  <PrivateRoute>
                    <AccountPage />
                  </PrivateRoute>
                }
              />
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
                <Route path="invoices/tao-hang-loat" element={<InvoiceBulkCreatePage />} />
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
                <Route
                  path="notifications"
                  element={
                    <RoleRoute roles={['Admin', 'Staff']}>
                      <NotificationManagerPage />
                    </RoleRoute>
                  }
                />
              </Route>

              <Route path="*" element={<div className="container mx-auto px-4 py-24 text-center"><h1 className="text-4xl font-black text-white">Không tìm thấy trang</h1><p className="mt-3 text-slate-400">Đường dẫn có thể đã thay đổi hoặc không tồn tại.</p><Link className="inline-block mt-6 rounded-xl bg-orange-500 px-5 py-3 font-bold text-white" to="/">Về trang chủ</Link></div>} />
              </Routes>
            </Suspense>
          </main>

          <Footer />
        </div>
      </Router>
      </NotificationCountProvider>
    </AuthProvider>
  );
}

export default App;
