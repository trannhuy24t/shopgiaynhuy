import { useEffect, useState } from 'react';
import { getUsers, createStaff, createTenantAccount, updateUserRole } from '../../../api/user';
import { getApiErrorMessage } from '../../../api/client';
import type { UserDto } from '../../../types/user';
import type { Role } from '../../../types/auth';
import { Plus, X, Users as UsersIcon, UserPlus } from 'lucide-react';

const roleOptions: Role[] = ['Admin', 'Staff', 'Tenant', 'User'];

const roleBadgeClass = (role: Role) => {
  switch (role) {
    case 'Admin':
      return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    case 'Staff':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'Tenant':
      return 'bg-green-500/10 text-green-400 border-green-500/20';
    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  }
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN');

const UserManagerPage = () => {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const [roleModalUser, setRoleModalUser] = useState<UserDto | null>(null);
  const [newRole, setNewRole] = useState<Role>('Tenant');
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleError, setRoleError] = useState('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({ fullName: '', email: '', password: '' });
  const [staffSaving, setStaffSaving] = useState(false);
  const [staffError, setStaffError] = useState('');

  const [isCreateTenantOpen, setIsCreateTenantOpen] = useState(false);
  const [tenantForm, setTenantForm] = useState({ fullName: '', email: '', password: '' });
  const [tenantSaving, setTenantSaving] = useState(false);
  const [tenantError, setTenantError] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getUsers(filterRole !== 'all' ? filterRole : undefined);
      setUsers(res.data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không tải được danh sách người dùng.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRole]);

  const openRoleModal = (user: UserDto) => {
    setRoleModalUser(user);
    setNewRole(user.role);
    setRoleError('');
  };

  const handleChangeRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleModalUser) return;
    setRoleError('');

    try {
      setRoleSaving(true);
      await updateUserRole(roleModalUser.id, { role: newRole });
      setRoleModalUser(null);
      await loadUsers();
    } catch (err) {
      setRoleError(getApiErrorMessage(err, 'Không thể đổi role người dùng này.'));
    } finally {
      setRoleSaving(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError('');

    if (!staffForm.fullName.trim() || !staffForm.email.trim() || staffForm.password.length < 6) {
      setStaffError('Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu (tối thiểu 6 ký tự).');
      return;
    }

    try {
      setStaffSaving(true);
      await createStaff(staffForm);
      setIsCreateOpen(false);
      setStaffForm({ fullName: '', email: '', password: '' });
      await loadUsers();
    } catch (err) {
      setStaffError(getApiErrorMessage(err, 'Không thể tạo tài khoản nhân viên (email có thể đã tồn tại).'));
    } finally {
      setStaffSaving(false);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setTenantError('');

    if (!tenantForm.fullName.trim() || !tenantForm.email.trim() || tenantForm.password.length < 6) {
      setTenantError('Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu (tối thiểu 6 ký tự).');
      return;
    }

    try {
      setTenantSaving(true);
      await createTenantAccount(tenantForm);
      setIsCreateTenantOpen(false);
      setTenantForm({ fullName: '', email: '', password: '' });
      await loadUsers();
    } catch (err) {
      setTenantError(getApiErrorMessage(err, 'Không thể tạo tài khoản khách thuê (email có thể đã tồn tại).'));
    } finally {
      setTenantSaving(false);
    }
  };

  return (
    <div className="max-w-6xl space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-900">
        <div>
          <span className="text-orange-500 text-xs font-black uppercase tracking-wider block mb-1">
            Tài khoản hệ thống
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Quản lý người dùng</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => { setIsCreateTenantOpen(true); setTenantError(''); }}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 active:scale-95 text-slate-200 hover:text-white text-xs font-bold px-5 py-3 rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <UserPlus size={16} /> Tạo tài khoản khách thuê
          </button>
          <button
            onClick={() => { setIsCreateOpen(true); setStaffError(''); }}
            className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold px-5 py-3 rounded-2xl flex items-center gap-1.5 transition-all shadow-lg shadow-orange-500/10 cursor-pointer"
          >
            <Plus size={16} /> Tạo tài khoản nhân viên
          </button>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold p-4 rounded-xl">
        Tài khoản tự đăng ký (`/auth/register`) mặc định có role <span className="font-black">User</span>, chưa dùng được chức năng nào — dùng nút "Đổi role" bên dưới để cấp quyền Tenant/Staff/Admin.
      </div>

      {/* Bộ lọc role */}
      <div className="flex flex-wrap gap-2 bg-slate-900/40 p-4 rounded-2xl border border-slate-850">
        <button
          onClick={() => setFilterRole('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            filterRole === 'all' ? 'bg-orange-500 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          Tất cả
        </button>
        {roleOptions.map((r) => (
          <button
            key={r}
            onClick={() => setFilterRole(r)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterRole === r ? 'bg-orange-500 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {loading && (
        <div className="min-h-[30vh] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold p-6 rounded-2xl text-center">
          {error}
        </div>
      )}

      {!loading && !error && users.length === 0 && (
        <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl">
          <UsersIcon className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-medium text-lg">Không có người dùng nào khớp với bộ lọc.</p>
        </div>
      )}

      {!loading && !error && users.length > 0 && (
        <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider bg-slate-950/20">
                  <th className="p-5">Họ tên</th>
                  <th className="p-5">Email</th>
                  <th className="p-5">Role</th>
                  <th className="p-5">Ngày tạo</th>
                  <th className="p-5 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/50">
                {users.map((u) => (
                  <tr key={u.id} className="text-slate-300 hover:bg-slate-950/10 transition-colors">
                    <td className="p-5 font-bold text-white">{u.fullName}</td>
                    <td className="p-5 font-medium text-slate-400">{u.email}</td>
                    <td className="p-5">
                      <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded border ${roleBadgeClass(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-5 font-medium text-slate-500">{formatDate(u.createdAt)}</td>
                    <td className="p-5 text-center">
                      <button
                        onClick={() => openRoleModal(u)}
                        className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition-all cursor-pointer"
                      >
                        Đổi role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL ĐỔI ROLE */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !roleSaving && setRoleModalUser(null)} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 sm:p-8 shadow-2xl animate-scale-up">
            <button onClick={() => setRoleModalUser(null)} className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer">
              <X size={20} />
            </button>
            <h3 className="font-bold text-xl text-white uppercase tracking-wide mb-2">Đổi role</h3>
            <p className="text-xs text-slate-500 mb-6">{roleModalUser.fullName} — {roleModalUser.email}</p>

            {roleError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold p-3 rounded-xl mb-4">
                {roleError}
              </div>
            )}

            <form onSubmit={handleChangeRole} className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Role mới</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as Role)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-3 py-3 text-sm text-white outline-none cursor-pointer"
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={roleSaving}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-bold py-3.5 rounded-2xl text-xs tracking-wide transition-colors cursor-pointer"
              >
                {roleSaving ? 'Đang lưu...' : 'Xác nhận đổi role'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TẠO STAFF */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !staffSaving && setIsCreateOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl animate-scale-up">
            <button onClick={() => setIsCreateOpen(false)} className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer">
              <X size={20} />
            </button>
            <h3 className="font-bold text-xl text-white uppercase tracking-wide mb-6">Tạo tài khoản nhân viên</h3>

            {staffError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold p-3 rounded-xl mb-4">
                {staffError}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={staffForm.fullName}
                  onChange={(e) => setStaffForm({ ...staffForm, fullName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Mật khẩu * (tối thiểu 6 ký tự)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={staffSaving}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-bold py-3.5 rounded-2xl text-xs tracking-wide transition-colors cursor-pointer"
              >
                {staffSaving ? 'Đang tạo...' : 'Tạo tài khoản'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TẠO KHÁCH THUÊ */}
      {isCreateTenantOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !tenantSaving && setIsCreateTenantOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl animate-scale-up">
            <button onClick={() => setIsCreateTenantOpen(false)} className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer">
              <X size={20} />
            </button>
            <h3 className="font-bold text-xl text-white uppercase tracking-wide mb-2">Tạo tài khoản khách thuê</h3>
            <p className="text-xs text-slate-500 mb-6">Tài khoản tạo ra có role <span className="font-bold text-green-400">Tenant</span> ngay, không cần đổi role tay. Khách tự điền hồ sơ khách thuê sau khi đăng nhập.</p>

            {tenantError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold p-3 rounded-xl mb-4">
                {tenantError}
              </div>
            )}

            <form onSubmit={handleCreateTenant} className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={tenantForm.fullName}
                  onChange={(e) => setTenantForm({ ...tenantForm, fullName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={tenantForm.email}
                  onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Mật khẩu * (tối thiểu 6 ký tự)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={tenantForm.password}
                  onChange={(e) => setTenantForm({ ...tenantForm, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-orange-500 rounded-xl px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={tenantSaving}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-bold py-3.5 rounded-2xl text-xs tracking-wide transition-colors cursor-pointer"
              >
                {tenantSaving ? 'Đang tạo...' : 'Tạo tài khoản'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagerPage;
