import { useCallback, useEffect, useState } from 'react';
import { createNotification, broadcastNotification } from '../../../api/notification';
import { getTenants } from '../../../api/tenant';
import { getApiErrorMessage } from '../../../api/client';
import { Bell, Send, CheckCircle } from 'lucide-react';
import type { NotificationType } from '../../../types/notification';
import type { TenantDto } from '../../../types/tenant';

const TYPES: { value: NotificationType; label: string }[] = [
  { value: 'ThongBaoChung', label: 'Thông báo chung' },
  { value: 'NhacNo', label: 'Nhắc nợ' },
  { value: 'HopDong', label: 'Hợp đồng' },
  { value: 'BaoTri', label: 'Bảo trì' },
];

const NotificationManagerPage = () => {
  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [tenantLoadError, setTenantLoadError] = useState('');

  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<NotificationType>('ThongBaoChung');

  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadTenants = useCallback(async () => {
    setLoadingTenants(true);
    setTenantLoadError('');
    try {
      const res = await getTenants();
      setTenants(res.data);
    } catch (err) {
      setTenants([]);
      setUserId('');
      setTenantLoadError(getApiErrorMessage(err, 'Không tải được danh sách khách thuê.'));
    } finally {
      setLoadingTenants(false);
    }
  }, []);

  useEffect(() => {
    void loadTenants();
  }, [loadTenants]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const id = userId === 'all' ? null : Number(userId);
    if (userId !== 'all' && !id) { setError('Vui lòng chọn người nhận.'); return; }
    if (!title.trim()) { setError('Tiêu đề không được để trống.'); return; }
    if (!content.trim()) { setError('Nội dung không được để trống.'); return; }

    try {
      setSending(true);
      if (userId === 'all') {
        const res = await broadcastNotification({ title: title.trim(), content: content.trim(), type });
        setSuccess(res.data.message);
      } else {
        await createNotification({ userId: id!, title: title.trim(), content: content.trim(), type });
        setSuccess('Gửi thông báo thành công!');
      }
      setTitle('');
      setContent('');
      setUserId('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Gửi thông báo thất bại.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div className="pb-4 border-b border-slate-900">
        <span className="text-orange-500 text-xs font-black uppercase tracking-wider block mb-1">Giao tiếp</span>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Gửi thông báo</h1>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <Bell size={18} className="text-orange-400" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">Thông báo thủ công</p>
            <p className="text-xs text-slate-400">Gửi thông báo trực tiếp đến khách thuê</p>
          </div>
        </div>

        <form onSubmit={handleSend} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Người nhận</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 focus:border-orange-500 text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors"
            >
              <option value="">-- Chọn khách thuê --</option>
              <option value="all">Tất cả khách thuê</option>
              {loadingTenants ? (
                <option disabled>Đang tải...</option>
              ) : (
                tenants.map((t) => (
                  <option key={t.userId} value={t.userId}>
                    {t.fullName} ({t.userEmail ?? t.email ?? `#${t.userId}`})
                  </option>
                ))
              )}
            </select>
            {tenantLoadError && (
              <div role="alert" className="mt-2 flex items-start justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
                <span>{tenantLoadError}</span>
                <button type="button" onClick={() => void loadTenants()} disabled={loadingTenants} className="shrink-0 font-bold text-orange-300 hover:text-orange-200 disabled:opacity-50">
                  {loadingTenants ? 'Đang tải...' : 'Thử lại'}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loại thông báo</label>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    type === t.value
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tiêu đề</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Thông báo lịch cắt điện"
              className="w-full bg-slate-800 border border-slate-700 focus:border-orange-500 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nội dung</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="Nhập nội dung thông báo..."
              className="w-full bg-slate-800 border border-slate-700 focus:border-orange-500 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm outline-none transition-colors resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
          )}
          {success && (
            <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
              <CheckCircle size={16} /> {success}
            </p>
          )}

          <button
            type="submit"
            disabled={sending}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send size={16} />
            {sending ? 'Đang gửi...' : 'Gửi thông báo'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NotificationManagerPage;
