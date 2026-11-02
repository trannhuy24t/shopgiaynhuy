import { useCallback, useEffect, useState } from 'react';
import { createNotification, broadcastNotification } from '../../../api/notification';
import { getTenants } from '../../../api/tenant';
import { getApiErrorMessage } from '../../../api/client';
import {
  Bell,
  Send,
  CheckCircle,
  ExternalLink,
  Copy,
  Phone,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import type { NotificationType } from '../../../types/notification';
import type { TenantDto } from '../../../types/tenant';

const TYPES: { value: NotificationType; label: string }[] = [
  { value: 'ThongBaoChung', label: 'Thông báo chung' },
  { value: 'NhacNo', label: 'Nhắc nợ' },
  { value: 'HopDong', label: 'Hợp đồng' },
  { value: 'BaoTri', label: 'Bảo trì' },
];

const cleanPhoneNumber = (phone?: string | null) => {
  if (!phone) return '';
  const trimmed = phone.replace(/[^0-9+]/g, '');
  if (trimmed.startsWith('+84')) return '0' + trimmed.slice(3);
  return trimmed.replace(/[^0-9]/g, '');
};

const formatZaloMessage = (titleStr: string, contentStr: string, typeStr: NotificationType) => {
  const typeLabel = TYPES.find((t) => t.value === typeStr)?.label || 'Thông báo';
  return `🔔 [${typeLabel.toUpperCase()}] TỪ QUẢN LÝ PHÒNG TRỌ\n\n📌 Tiêu đề: ${titleStr}\n📝 Nội dung:\n${contentStr}\n\n⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}`;
};

const NotificationManagerPage = () => {
  const [tenants, setTenants] = useState<TenantDto[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [tenantLoadError, setTenantLoadError] = useState('');

  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<NotificationType>('ThongBaoChung');
  const [sendZalo, setSendZalo] = useState(true);

  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [zaloStatus, setZaloStatus] = useState<{
    tenantName: string;
    phone: string;
    url: string;
    copiedMessage: string;
  } | null>(null);
  const [broadcastZaloList, setBroadcastZaloList] = useState<{ message: string } | null>(null);

  const selectedTenant = tenants.find((t) => String(t.userId) === userId);
  const selectedTenantPhone = cleanPhoneNumber(selectedTenant?.phone);

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
    setZaloStatus(null);
    setBroadcastZaloList(null);

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

    const formattedZaloText = formatZaloMessage(title.trim(), content.trim(), type);
    const targetTenant = selectedTenant;
    const targetCleanPhone = selectedTenantPhone;

    try {
      setSending(true);
      if (userId === 'all') {
        const res = await broadcastNotification({ title: title.trim(), content: content.trim(), type });
        setSuccess(res.data.message);
        setBroadcastZaloList({ message: formattedZaloText });
      } else {
        await createNotification({ userId: id!, title: title.trim(), content: content.trim(), type });
        setSuccess('Gửi thông báo thành công!');

        // Gửi qua Zalo nếu bật tuỳ chọn và khách có số điện thoại
        if (sendZalo && targetCleanPhone && targetTenant) {
          try {
            await navigator.clipboard.writeText(formattedZaloText);
          } catch {
            // Không chặn nếu clipboard bị hạn chế
          }
          const zaloUrl = `https://zalo.me/${targetCleanPhone}`;
          window.open(zaloUrl, '_blank', 'noopener,noreferrer');
          setZaloStatus({
            tenantName: targetTenant.fullName,
            phone: targetTenant.phone || targetCleanPhone,
            url: zaloUrl,
            copiedMessage: formattedZaloText,
          });
        }
      }
      setTitle('');
      setContent('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Gửi thông báo thất bại.'));
    } finally {
      setSending(false);
    }
  };

  const tenantsWithPhone = tenants.filter((t) => Boolean(cleanPhoneNumber(t.phone)));

  return (
    <div className="max-w-2xl space-y-8">

      <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <Bell size={18} className="text-orange-400" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">Gửi thông báo hệ thống & Zalo</p>
            <p className="text-xs text-slate-400">Gửi trực tiếp đến khách thuê qua chuông web và tin nhắn Zalo</p>
          </div>
        </div>

        <form onSubmit={handleSend} className="space-y-5">
          {/* Người nhận */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Người nhận</label>
            <select
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                setZaloStatus(null);
              }}
              className="w-full bg-slate-800 border border-slate-700 focus:border-orange-500 text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors"
            >
              <option value="">-- Chọn khách thuê --</option>
              <option value="all">📢 Tất cả khách thuê</option>
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

          {/* Hộp tùy chọn Zalo khi đã chọn khách thuê cụ thể */}
          {selectedTenant && (
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#0068FF] text-white font-black text-xs flex items-center justify-center shadow-md">
                    Zalo
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">{selectedTenant.fullName}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {selectedTenant.phone ? `SĐT: ${selectedTenant.phone}` : 'Chưa cập nhật số điện thoại'}
                    </span>
                  </div>
                </div>

                {selectedTenantPhone ? (
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Sẵn sàng gửi Zalo
                  </span>
                ) : (
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1">
                    <AlertTriangle size={12} /> Chưa có SĐT
                  </span>
                )}
              </div>

              {selectedTenantPhone ? (
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-300 hover:text-white pt-1">
                  <input
                    type="checkbox"
                    checked={sendZalo}
                    onChange={(e) => setSendZalo(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-500 focus:ring-blue-400 bg-slate-800 border-slate-700 cursor-pointer"
                  />
                  <span>Đồng thời chuyển tiếp nội dung sang tin nhắn Zalo cho khách</span>
                </label>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  Khách thuê này chưa cập nhật số điện thoại trong hồ sơ, thông báo sẽ chỉ gửi qua chuông trên website.
                </p>
              )}
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
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tiêu đề</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Thông báo đóng tiền phòng tháng này / Lịch cắt điện"
              className="w-full bg-slate-800 border border-slate-700 focus:border-orange-500 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
            />
          </div>

          {/* Nội dung */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nội dung</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="Nhập nội dung thông báo gửi đến khách thuê..."
              className="w-full bg-slate-800 border border-slate-700 focus:border-orange-500 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm outline-none transition-colors resize-none"
            />
          </div>

          {/* Lỗi */}
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
          )}

          {/* Thành công */}
          {success && (
            <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
              <CheckCircle size={18} className="text-emerald-400 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Banner thông báo trạng thái gửi Zalo */}
          {zaloStatus && (
            <div className="bg-[#0068FF]/15 border border-[#0068FF]/40 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0068FF] text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md shadow-blue-500/30">
                  Zalo
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Đã mở liên kết Zalo của khách thuê!</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-normal">Đã sao chép nội dung</span>
                  </h4>
                  <p className="text-xs text-blue-200">
                    Khách nhận: <strong className="text-white">{zaloStatus.tenantName}</strong> — Số Zalo: <span className="font-mono text-white font-bold">{zaloStatus.phone}</span>
                  </p>
                </div>
              </div>

              {/* Hướng dẫn 2 bước trực quan */}
              <div className="bg-slate-950/70 border border-blue-500/20 rounded-xl p-3 text-xs space-y-2 text-slate-300">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle size={14} /> Cách gửi tin trong 3 giây:
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1 leading-relaxed">
                  <li>
                    Tại tab Zalo vừa mở, bấm nút <strong className="text-white bg-[#0068FF] px-2 py-0.5 rounded text-[11px]">Nhắn tin</strong> để mở khung chat.
                  </li>
                  <li>
                    Bấm phím <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-amber-300 font-mono font-bold">Ctrl + V</kbd> (hoặc chuột phải chọn <strong>Dán</strong>) rồi bấm <strong>Gửi</strong>.
                  </li>
                </ol>
                <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-850 italic">
                  * Zalo có chính sách bảo mật chống spam nên không cho phép website ngoài tự gõ chữ trực tiếp, hệ thống đã tự động copy toàn bộ nội dung sẵn cho bạn.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-blue-500/20">
                <a
                  href={zaloStatus.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0068FF] hover:bg-blue-600 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <ExternalLink size={14} /> Mở lại tab Zalo chat
                </a>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(zaloStatus.copiedMessage);
                    alert('Đã sao chép lại nội dung thông báo vào bộ nhớ tạm!');
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                >
                  <Copy size={14} /> Sao chép lại nội dung
                </button>
              </div>
            </div>
          )}

          {/* Nút gửi */}
          {selectedTenantPhone && sendZalo ? (
            <button
              type="submit"
              disabled={sending}
              className="w-full bg-[#0068FF] hover:bg-blue-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-blue-500/25 active:scale-98"
            >
              <div className="w-5 h-5 rounded-md bg-white text-[#0068FF] font-black text-[10px] flex items-center justify-center">
                Zalo
              </div>
              <span>{sending ? 'Đang gửi...' : 'Gửi thông báo & Mở Zalo chat cho khách'}</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={sending}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/20 active:scale-98"
            >
              <Send size={16} />
              <span>{sending ? 'Đang gửi...' : 'Gửi thông báo'}</span>
            </button>
          )}
        </form>

        {/* Danh sách gửi Zalo nhanh khi chọn gửi cho tất cả khách thuê */}
        {broadcastZaloList && tenantsWithPhone.length > 0 && (
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#0068FF] text-white font-black text-xs flex items-center justify-center">
                  Zalo
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Gửi tiếp qua Zalo cho từng khách:</h4>
                  <p className="text-[11px] text-slate-400">Bấm nút để tự động copy nội dung và mở chat Zalo với khách</p>
                </div>
              </div>
              <span className="text-xs text-orange-400 font-bold">{tenantsWithPhone.length} khách có SĐT</span>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {tenantsWithPhone.map((t) => {
                const clean = cleanPhoneNumber(t.phone);
                return (
                  <div
                    key={t.userId}
                    className="flex items-center justify-between p-3 bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{t.fullName}</p>
                      <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                        <Phone size={11} className="text-emerald-400" /> {t.phone}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(broadcastZaloList.message);
                        window.open(`https://zalo.me/${clean}`, '_blank', 'noopener,noreferrer');
                      }}
                      className="px-3 py-1.5 bg-[#0068FF] hover:bg-blue-600 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow cursor-pointer"
                    >
                      <MessageSquare size={13} /> Nhắn Zalo
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationManagerPage;
