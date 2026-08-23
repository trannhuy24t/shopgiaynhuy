import { useEffect, useState } from 'react';
import { getMyNotifications, markNotificationRead } from '../../api/notification';
import { getApiErrorMessage } from '../../api/client';
import { useNotificationCount } from '../../context/NotificationContext';
import StatusBadge from '../../components/Common/StatusBadge';
import type { NotificationDto } from '../../types/notification';
import { Bell, Check, CheckCheck } from 'lucide-react';

const formatDateTime = (iso: string) => {
  return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingId, setMarkingId] = useState<number | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const { refreshUnreadCount } = useNotificationCount();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await getMyNotifications();
        setNotifications(res.data);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Không tải được danh sách thông báo.'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleMarkRead = async (id: number) => {
    setMarkingId(id);
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      refreshUnreadCount();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Không thể đánh dấu đã đọc.'));
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (unreadIds.length === 0) return;

    setMarkingAll(true);
    // Không có endpoint đánh dấu hàng loạt ở backend — gọi song song API đánh dấu từng cái.
    const results = await Promise.allSettled(unreadIds.map((id) => markNotificationRead(id)));
    const succeededIds = new Set(unreadIds.filter((_, idx) => results[idx].status === 'fulfilled'));

    setNotifications((prev) => prev.map((n) => (succeededIds.has(n.id) ? { ...n, isRead: true } : n)));
    setMarkingAll(false);
    refreshUnreadCount();

    const failedCount = unreadIds.length - succeededIds.size;
    if (failedCount > 0) {
      alert(`Đã đọc ${succeededIds.size}/${unreadIds.length} thông báo — ${failedCount} thông báo đánh dấu thất bại, thử lại sau.`);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-orange-500 text-xs font-black uppercase tracking-wider block mb-1">
            Tài khoản của tôi
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
            Thông báo
            {unreadCount > 0 && (
              <span className="text-xs bg-orange-500 text-white font-bold px-2.5 py-1 rounded-full">{unreadCount} mới</span>
            )}
          </h1>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 disabled:opacity-50 text-slate-300 hover:text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <CheckCheck size={14} /> {markingAll ? 'Đang xử lý...' : 'Đọc tất cả'}
          </button>
        )}
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

      {!loading && !error && notifications.length === 0 && (
        <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl">
          <Bell className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-medium text-lg">Bạn chưa có thông báo nào.</p>
        </div>
      )}

      {!loading && !error && notifications.length > 0 && (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 rounded-2xl border flex items-start justify-between gap-4 transition-colors ${
                n.isRead
                  ? 'bg-slate-900/40 border-slate-850'
                  : 'bg-slate-900 border-orange-500/30'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />}
                  <h4 className="font-bold text-white text-sm">{n.title}</h4>
                  <StatusBadge entity="notificationType" value={n.type} />
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{n.content}</p>
                <p className="text-[10px] text-slate-600 font-semibold mt-2">{formatDateTime(n.createdAt)}</p>
              </div>
              {!n.isRead && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  disabled={markingId === n.id}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-50 text-slate-300 hover:text-white font-bold px-3 py-2 rounded-xl text-[10px] transition-all cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Check size={12} /> Đã đọc
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
