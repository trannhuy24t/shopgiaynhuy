import { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { changePassword } from '../../api/auth';
import { updateProfile } from '../../api/user';
import { getApiErrorMessage } from '../../api/client';
import { User, KeyRound, Send, CheckCircle, MessageSquare } from 'lucide-react';

const AccountPage = () => {
  const { user, updateUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? '');
  const [telegramChatId, setTelegramChatId] = useState(user?.telegramChatId ?? '');

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

    if (!fullName.trim()) {
      setProfileError('Họ tên không được để trống.');
      return;
    }

    try {
      setSavingProfile(true);
      const res = await updateProfile({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim() || null,
        telegramChatId: telegramChatId.trim() || null,
      });

      updateUser({
        fullName: res.data.fullName,
        phoneNumber: res.data.phoneNumber,
        telegramChatId: res.data.telegramChatId,
      });
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
        <p className="text-sm text-slate-400 mt-1">Quản lý thông tin cá nhân, liên kết Telegram và đổi mật khẩu.</p>
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

        {/* Form cập nhật thông tin cá nhân & Telegram Chat ID */}
        <form onSubmit={handleProfileSubmit} className="space-y-4 border-b border-slate-800 pb-6">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <User size={16} className="text-orange-400" /> Thông tin cá nhân & Telegram
          </h2>

          <label className="block text-xs text-slate-400">
            Họ và tên *
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-3 text-sm text-white outline-none focus:border-orange-500"
            />
          </label>

          <label className="block text-xs text-slate-400">
            Số điện thoại
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="VD: 0983388132"
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-3 text-sm text-white outline-none focus:border-orange-500"
            />
          </label>

          {/* Ô nhập liệu Telegram Chat ID */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
              <Send size={13} className="text-blue-400" /> Telegram Chat ID (Nhận thông báo đẩy 24/7)
            </label>
            <input
              type="text"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              placeholder="VD: 123456789"
              className="w-full rounded-xl border border-blue-500/30 bg-blue-500/5 px-3 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-400 transition-colors"
            />
            <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              💡 <strong>Hướng dẫn lấy Chat ID:</strong> Mở ứng dụng Telegram, tìm và chat <code className="text-blue-300 font-mono">/start</code> với bot <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">@userinfobot</a> để lấy số Id cá nhân, sau đó dán vào đây để nhận thông báo chuông điện thoại.
            </p>
          </div>

          {profileError && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">{profileError}</p>}
          {profileSuccess && (
            <p className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 border border-green-500/20 p-3 rounded-xl">
              <CheckCircle size={15} /> Đã cập nhật hồ sơ & Telegram Chat ID thành công.
            </p>
          )}

          <button
            type="submit"
            disabled={savingProfile}
            className="rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 px-5 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-orange-500/20"
          >
            {savingProfile ? 'Đang lưu...' : 'Lưu thông tin'}
          </button>
        </form>

        {/* Đổi mật khẩu */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <KeyRound size={16} className="text-orange-400" /> Đổi mật khẩu
          </h2>

          {[
            { label: 'Mật khẩu hiện tại', value: currentPassword, setValue: setCurrentPassword },
            { label: 'Mật khẩu mới', value: newPassword, setValue: setNewPassword },
            { label: 'Xác nhận mật khẩu mới', value: confirmPassword, setValue: setConfirmPassword },
          ].map((field) => (
            <div className="space-y-1.5" key={field.label}>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{field.label}</label>
              <div className="relative">
                <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  value={field.value}
                  onChange={(e) => field.setValue(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-orange-500 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-colors"
                />
              </div>
            </div>
          ))}

          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}
          {success && (
            <p className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
              <CheckCircle size={16} /> Đổi mật khẩu thành công.
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-800 hover:bg-slate-750 text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors cursor-pointer border border-slate-700 disabled:opacity-50"
          >
            {loading ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AccountPage;
