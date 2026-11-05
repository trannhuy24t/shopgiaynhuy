import { useCallback, useEffect, useState } from 'react';
import { createNotification, broadcastNotification } from '../../../api/notification';
import { getTenants } from '../../../api/tenant';
import { getApiErrorMessage } from '../../../api/client';
import {
  Bell,
  Send,
  CheckCircle,
  AlertCircle,
  Users,
  MessageCircle,
} from 'lucide-react';
import type { NotificationType } from '../../../types/notification';
import type { TenantDto } from '../../../types/tenant';
import WebPushSettingsCard from '../../../components/Common/WebPushSettingsCard';

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

  const selectedTenant = tenants.find((t) => String(t.userId) === userId);

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
    if (userId !== 'all' && !id) {
      setError('Vui lòng chọn người nhận.');
      return;
    }
    if (!title.trim()) {
      setError('Tiêu đề không được để trống.');
      return;
    }
    if (!content.trim()) {
      setError('Nội dung không được để trống.');
      return;
    }

    try {
      setSending(true);
      if (userId === 'all') {
        const res = await broadcastNotification({ title: title.trim(), content: content.trim(), type });
        setSuccess(res.data.message || 'Đã phát thông báo thành công tới tất cả khách thuê & Telegram!');
      } else {
        await createNotification({ userId: id!, title: title.trim(), content: content.trim(), type });
        setSuccess('Đã gửi thông báo thành công! Hệ thống đã tự động đẩy chuông web, Web Push và tin nhắn Telegram.');
      }
      setTitle('');
      setContent('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Gửi thông báo thất bại.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      {/* Cài đặt nhận thông báo đẩy Web Push về máy tính/điện thoại */}
      <WebPushSettingsCard />

      <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <Bell size={18} className="text-orange-400" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">Gửi thông báo hệ thống & Telegram</p>
            <p className="text-xs text-slate-400">Tự động phát thông báo qua chuông web, thông báo đẩy (Web Push) và Telegram Bot</p>
          </div>
        </div>

        <form onSubmit={handleSend} className="space-y-5">
          {/* Người nhận */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Người nhận *</label>
            <select
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                setSuccess('');
                setError('');
              }}
              className="w-full bg-slate-800 border border-slate-700 focus:border-orange-500 text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors cursor-pointer"
            >
              <option value="">-- Chọn khách thuê nhận thông báo --</option>
              <option value="all">📢 Tất cả khách thuê (Broadcast toàn hệ thống)</option>
              {loadingTenants ? (
                <option disabled>Đang tải danh sách...</option>
              ) : (
                tenants.map((t) => (
                  <option key={t.userId} value={t.userId}>
                    {t.fullName} {t.phone ? `— SĐT: ${t.phone}` : ''} ({t.userEmail ?? t.email ?? `#${t.userId}`})
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

          {/* Thẻ trạng thái kết nối Telegram khi chọn khách cụ thể */}
          {selectedTenant && (
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                    <Send size={15} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">{selectedTenant.fullName}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {selectedTenant.phone ? `SĐT: ${selectedTenant.phone}` : 'Chưa có số điện thoại'}
                    </span>
                  </div>
                </div>

                {selectedTenant.telegramChatId ? (
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Đã liên kết Telegram
                  </span>
                ) : (
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-semibold flex items-center gap-1.5">
                    <AlertCircle size={12} className="text-amber-400" />
                    Chưa liên kết Telegram
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed pt-1 border-t border-slate-850">
                {selectedTenant.telegramChatId ? (
                  <>
                    ✈️ Tin nhắn sẽ được <strong className="text-emerald-400">bắn trực tiếp 1-1</strong> về Telegram cá nhân (Chat ID: <span className="font-mono text-white font-bold">{selectedTenant.telegramChatId}</span>) và <strong className="text-blue-400">đồng thời nhắc đích danh tên {selectedTenant.fullName} trong Nhóm Telegram Ban Quản Lý</strong>.
                  </>
                ) : (
                  <>
                    ℹ️ Khách chưa liên kết Telegram cá nhân. Thông báo sẽ gửi qua <strong className="text-white">Chuông Web</strong>, <strong className="text-white">Web Push</strong> và <strong className="text-blue-400">luôn tự động nhắc đích danh tên khách thuê {selectedTenant.fullName} trong Nhóm Telegram Ban Quản Lý</strong>.
                  </>
                )}
              </p>
            </div>
          )}

          {/* Khi chọn phát cho tất cả khách thuê */}
          {userId === 'all' && (
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-blue-300 font-bold">
                <Users size={16} />
                <span>Chế độ thông báo hàng loạt (Broadcast)</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Thông báo này sẽ được gửi tới tất cả <strong className="text-white">{tenants.length} khách thuê</strong> qua chuông web, thông báo đẩy Web Push, nhóm Telegram Ban Quản Lý và gửi riêng cho các khách thuê đã liên kết Telegram.
              </p>
            </div>
          )}

          {/* Loại thông báo */}
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
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tiêu đề */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tiêu đề *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Thông báo đóng tiền phòng tháng này / Lịch cắt điện"
              className="w-full bg-slate-800 border border-slate-700 focus:border-orange-500 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
            />
          </div>

          {/* Nội dung */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nội dung *</label>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="Nhập nội dung thông báo gửi đến khách thuê..."
              className="w-full bg-slate-800 border border-slate-700 focus:border-orange-500 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm outline-none transition-colors resize-none"
            />
          </div>

          {/* Thông báo lỗi */}
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
          )}

          {/* Thông báo thành công */}
          {success && (
            <div className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 flex items-start gap-2.5 leading-relaxed">
              <CheckCircle size={18} className="text-emerald-400 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Nút gửi */}
          <button
            type="submit"
            disabled={sending}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/20 active:scale-98"
          >
            <Send size={16} />
            <span>{sending ? 'Đang gửi thông báo...' : 'Gửi thông báo ngay'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default NotificationManagerPage;
