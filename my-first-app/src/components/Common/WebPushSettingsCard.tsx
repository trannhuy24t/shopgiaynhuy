import { useEffect, useState } from 'react';
import {
  isPushSupported,
  getNotificationPermission,
  getCurrentSubscription,
  subscribeCurrentDevice,
  unsubscribeCurrentDevice,
} from '../../utils/webPush';
import { getPushStatus, sendTestPush } from '../../api/pushNotification';
import {
  BellRing,
  CheckCircle,
  AlertCircle,
  Send,
  Loader2,
  ShieldAlert,
  Smartphone,
  Laptop,
} from 'lucide-react';

interface WebPushSettingsCardProps {
  className?: string;
}

export const WebPushSettingsCard = ({ className = '' }: WebPushSettingsCardProps) => {
  const supported = isPushSupported();
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [deviceCount, setDeviceCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const checkStatus = async () => {
    if (!supported) {
      setPermission('unsupported');
      return;
    }

    setPermission(getNotificationPermission());
    const sub = await getCurrentSubscription();
    setIsSubscribed(Boolean(sub));

    try {
      const status = await getPushStatus(sub?.endpoint);
      setDeviceCount(status.subscribedDevicesCount);
      if (sub && status.isDeviceSubscribed) {
        setIsSubscribed(true);
      }
    } catch {
      // Bỏ qua lỗi nếu chưa đăng nhập hoặc mạng yếu
    }
  };

  useEffect(() => {
    void checkStatus();
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await subscribeCurrentDevice();
      if (res.success) {
        setMsg({ type: 'success', text: res.message });
        setIsSubscribed(true);
        setPermission('granted');
        void checkStatus();
      } else {
        setMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.message || 'Không thể kích hoạt thông báo đẩy.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await unsubscribeCurrentDevice();
      setMsg({ type: 'info', text: res.message });
      setIsSubscribed(false);
      void checkStatus();
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.message || 'Lỗi khi hủy thông báo đẩy.' });
    } finally {
      setLoading(false);
    }
  };

  const handleTestPush = async () => {
    setTesting(true);
    setMsg(null);
    try {
      await sendTestPush({
        title: '🔔 Thông báo thử nghiệm từ TroHub',
        content: 'Tuyệt vời! Thiết bị của bạn đã nhận được thông báo đẩy thành công ngay cả khi đóng web.',
        url: '/thong-bao',
      });
      setMsg({
        type: 'success',
        text: 'Đã gửi thông báo đẩy thử nghiệm! Hãy kiểm tra góc màn hình máy tính hoặc màn hình khóa điện thoại của bạn.',
      });
    } catch (err: any) {
      setMsg({
        type: 'error',
        text: err?.response?.data?.message || err?.message || 'Không thể gửi thông báo thử nghiệm.',
      });
    } finally {
      setTesting(false);
    }
  };

  if (!supported) {
    return (
      <div className={`bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-400 text-xs ${className}`}>
        <div className="flex items-center gap-3 text-amber-400 font-bold mb-2">
          <AlertCircle size={18} />
          <span>Trình duyệt hiện tại chưa hỗ trợ Web Push</span>
        </div>
        <p className="text-slate-500">
          Vui lòng sử dụng Google Chrome, Microsoft Edge, Safari (iOS 16.4+) hoặc Firefox để nhận thông báo đẩy khi đóng web.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800/80 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xl relative overflow-hidden ${className}`}>
      {/* Background glow decoration */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center shadow-lg shadow-orange-500/10">
            <BellRing size={22} className="animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              Thông báo đẩy thiết bị (Web Push)
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                PWA / VAPID
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Nhận chuông và popup thông báo trên máy tính & điện thoại ngay cả khi <strong>tắt web</strong>
            </p>
          </div>
        </div>

        {/* Trạng thái thiết bị này */}
        <div className="flex items-center gap-2">
          {permission === 'denied' ? (
            <span className="text-xs px-3 py-1.5 rounded-full bg-red-500/15 text-red-300 border border-red-500/30 font-semibold flex items-center gap-1.5">
              <ShieldAlert size={14} /> Bị chặn quyền
            </span>
          ) : isSubscribed ? (
            <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Đang hoạt động trên máy này
            </span>
          ) : (
            <span className="text-xs px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1.5">
              <AlertCircle size={14} /> Chưa bật trên máy này
            </span>
          )}
        </div>
      </div>

      {/* Thông tin chi tiết */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3">
          <Laptop size={18} className="text-blue-400 shrink-0" />
          <div>
            <p className="text-slate-400 text-[11px]">Trạng thái trình duyệt</p>
            <p className="font-semibold text-white">
              {permission === 'granted'
                ? 'Đã cấp quyền thông báo'
                : permission === 'denied'
                ? 'Bị chặn (cần mở lại ở khóa trang web)'
                : 'Chưa cấp quyền'}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3">
          <Smartphone size={18} className="text-purple-400 shrink-0" />
          <div>
            <p className="text-slate-400 text-[11px]">Thiết bị đã kết nối với tài khoản</p>
            <p className="font-semibold text-white">
              {deviceCount > 0 ? `${deviceCount} thiết bị đang nhận tin` : 'Chưa có thiết bị nào'}
            </p>
          </div>
        </div>
      </div>

      {/* Thông báo kết quả thao tác */}
      {msg && (
        <div
          role="status"
          className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 ${
            msg.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-200'
              : msg.type === 'error'
              ? 'bg-red-500/15 border border-red-500/30 text-red-200'
              : 'bg-blue-500/15 border border-blue-500/30 text-blue-200'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle size={16} className="shrink-0 text-emerald-400 mt-0.5" />
          ) : (
            <AlertCircle size={16} className="shrink-0 text-amber-400 mt-0.5" />
          )}
          <span className="leading-relaxed">{msg.text}</span>
        </div>
      )}

      {/* Hướng dẫn khi bị chặn quyền */}
      {permission === 'denied' && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs space-y-1.5 leading-relaxed">
          <p className="font-bold flex items-center gap-1.5 text-amber-300">
            <ShieldAlert size={14} /> Cách mở lại quyền thông báo trên trình duyệt:
          </p>
          <p>
            1. Bấm vào biểu tượng <strong>Ổ khóa</strong> (hoặc biểu tượng Cài đặt trang web) ở góc trái thanh địa chỉ URL.
          </p>
          <p>
            2. Tại mục <strong>Thông báo (Notifications)</strong>, chuyển từ <em>Chặn (Block)</em> sang <em>Cho phép (Allow)</em>.
          </p>
          <p>3. Tải lại trang (F5) và bấm lại nút Bật thông báo bên dưới.</p>
        </div>
      )}

      {/* Các nút hành động */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        {!isSubscribed ? (
          <button
            type="button"
            disabled={loading}
            onClick={handleSubscribe}
            className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-orange-500/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <BellRing size={15} />}
            <span>Bật thông báo đẩy về máy này</span>
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={testing}
              onClick={handleTestPush}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {testing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              <span>Gửi thử thông báo tới máy này</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleUnsubscribe}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white font-semibold text-xs rounded-xl transition-all cursor-pointer border border-slate-700 disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : 'Tắt trên máy này'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default WebPushSettingsCard;

