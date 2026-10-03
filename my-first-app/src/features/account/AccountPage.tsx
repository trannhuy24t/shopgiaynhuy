import { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { updateProfile } from '../../api/user';
import { getApiErrorMessage } from '../../api/client';
import { User, Phone, Save, CheckCircle } from 'lucide-react';

const AccountPage = () => {
  const { user, updateUser } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!fullName.trim()) {
      setError('Họ tên không được để trống.');
      return;
    }

    try {
      setLoading(true);
      const res = await updateProfile({ fullName: fullName.trim(), phoneNumber: phoneNumber.trim() || null });
      updateUser({ fullName: res.data.fullName, phoneNumber: res.data.phoneNumber });
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
        <h1 className="text-2xl font-black text-white tracking-tight">Thông tin tài khoản</h1>
        <p className="text-sm text-slate-400 mt-1">Cập nhật họ tên và số điện thoại liên hệ của bạn.</p>
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Họ và tên</label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full bg-slate-800 border border-slate-700 focus:border-orange-500 text-white placeholder-slate-500 rounded-xl pl-9 pr-4 py-3 text-sm outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Số điện thoại</label>
            <div className="relative">
              <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="0901234567"
                className="w-full bg-slate-800 border border-slate-700 focus:border-orange-500 text-white placeholder-slate-500 rounded-xl pl-9 pr-4 py-3 text-sm outline-none transition-colors"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
          )}

          {success && (
            <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
              <CheckCircle size={16} /> Cập nhật thành công!
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save size={16} />
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AccountPage;
