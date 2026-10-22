import { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { changePassword } from '../../api/auth';
import { updateProfile } from '../../api/user';
import { getApiErrorMessage } from '../../api/client';
import { User, KeyRound, Save, CheckCircle } from 'lucide-react';

const AccountPage = () => {
  const { user, updateUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess(false);
    if (!fullName.trim()) { setProfileError('Họ tên không được để trống.'); return; }
    try {
      setSavingProfile(true);
      const res = await updateProfile({ fullName: fullName.trim(), phoneNumber: phoneNumber.trim() || null });
      updateUser({ fullName: res.data.fullName, phoneNumber: res.data.phoneNumber });
      setProfileSuccess(true);
    } catch (err) {
      setProfileError(getApiErrorMessage(err, 'Không cập nhật được hồ sơ.'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      setLoading(true);
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Cập nhật thất bại.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white tracking-tight">Tài khoản và bảo mật</h1>
        <p className="text-sm text-slate-400 mt-1">Quản lý thông tin đăng nhập và bảo mật tài khoản.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
        {/* Avatar placeholder */}
        <div className="flex items-center gap-4 pb-4 border-b border-slate-800">
          <div className="w-14 h-14 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
            <User size={28} className="text-orange-400" />
          </div>
          <div>
            <p className="font-bold text-white">{user?.fullName}</p>
            <p className="text-xs text-slate-400">{user?.email}</p>
            <span className="text-[10px] font-semibold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20 mt-1 inline-block">
              {user?.role}
            </span>
          </div>
        </div>

        {user?.role !== 'Tenant' && (
          <form onSubmit={handleProfileSubmit} className="space-y-4 border-b border-slate-800 pb-6">
            <h2 className="text-sm font-bold text-white">Thông tin cá nhân</h2>
            <label className="block text-xs text-slate-400">Họ và tên<input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-3 text-sm text-white" /></label>
            <label className="block text-xs text-slate-400">Số điện thoại<input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-3 text-sm text-white" /></label>
            {profileError && <p className="text-sm text-red-400">{profileError}</p>}
            {profileSuccess && <p className="flex items-center gap-2 text-sm text-green-400"><CheckCircle size={15} /> Đã cập nhật hồ sơ.</p>}
            <button disabled={savingProfile} className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{savingProfile ? 'Đang lưu...' : 'Lưu hồ sơ'}</button>
          </form>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {[
            { label: 'Mật khẩu hiện tại', value: currentPassword, setValue: setCurrentPassword },
            { label: 'Mật khẩu mới', value: newPassword, setValue: setNewPassword },
            { label: 'Xác nhận mật khẩu mới', value: confirmPassword, setValue: setConfirmPassword },
          ].map((field, index) => (
            <div className="space-y-1.5" key={field.label}>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{field.label}</label>
              <div className="relative">
                <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength={index === 0 ? undefined : 6}
                  autoComplete={index === 0 ? 'current-password' : 'new-password'}
                  value={field.value}
                  onChange={(e) => field.setValue(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-orange-500 text-white rounded-xl pl-9 pr-4 py-3 text-sm outline-none transition-colors"
                />
              </div>
            </div>
          ))}

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
          )}

          {success && (
            <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
              <CheckCircle size={16} /> Đổi mật khẩu thành công.
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save size={16} />
            {loading ? 'Đang lưu...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AccountPage;
