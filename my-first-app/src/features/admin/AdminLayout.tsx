import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { adminMenu, getMenuForRole } from '../../constants/menuConfig';

const AdminLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const items = getMenuForRole(adminMenu, user?.role);

  return (
    <div className="container mx-auto px-4 py-8 max-w-[1600px] flex flex-col lg:flex-row gap-8">
      <aside className="lg:w-64 shrink-0">
        <nav className="bg-slate-900 border border-slate-850 rounded-2xl p-3 space-y-1 lg:sticky lg:top-24">
          {items.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={16} /> {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-grow min-w-0">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;

// Truy cập /admin (không có route con) sẽ tự chuyển tới mục đầu tiên user có quyền xem —
// Admin -> Quản lý phòng, không có mục nào phù hợp (không nên xảy ra vì AdminLayout đã bị
// RoleRoute chặn trước) -> về trang chủ.
export const AdminIndexRedirect = () => {
  const { user } = useAuth();
  const items = getMenuForRole(adminMenu, user?.role);
  return <Navigate to={items[0]?.path ?? '/'} replace />;
};
