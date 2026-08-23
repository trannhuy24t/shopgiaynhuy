import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyNotifications, markNotificationRead } from '../../api/notification';
import { useNotificationCount } from '../../context/NotificationContext';
import StatusBadge from './StatusBadge';
import type { NotificationDto } from '../../types/notification';
import { Bell, CheckCheck } from 'lucide-react';

const PREVIEW_LIMIT = 8;

const formatRelativeTime = (iso: string) => {
  const date = new Date(iso);
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);

  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} ngày trước`;

  return date.toLocaleDateString('vi-VN');
};

// Chuông thông báo dạng dropdown — thay cho việc điều hướng sang trang riêng, để xem nhanh và
// đóng lại (bấm ra ngoài) mà không rời trang đang xem.
const NotificationDropdown = () => {
  const navigate = useNavigate();
  const { unreadCount, refreshUnreadCount } = useNotificationCount();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);

    if (next) {
      setLoading(true);
      getMyNotifications()
        .then((res) => setNotifications(res.data))
        .catch(() => setNotifications([]))
        .finally(() => setLoading(false));
    }
  };

  const handleMarkRead = async (n: NotificationDto) => {
    if (n.isRead) return;

    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    try {
      await markNotificationRead(n.id);
      refreshUnreadCount();
    } catch {
      // Bỏ qua lỗi ngầm — không chặn việc xem thông báo chỉ vì đánh dấu đã đọc thất bại
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.length === 0) return;

    setMarkingAll(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await Promise.allSettled(unread.map((n) => markNotificationRead(n.id)));
    refreshUnreadCount();
    setMarkingAll(false);
  };

  const handleViewAll = () => {
    setOpen(false);
    navigate('/thong-bao');
  };

  const preview = notifications.slice(0, PREVIEW_LIMIT);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleToggle}
        className="relative p-2 hover:bg-slate-800 rounded-full transition-all text-slate-300 hover:text-orange-500 cursor-pointer"
        title="Thông báo"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] font-black rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-scale-up">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-850">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-orange-500 text-white font-bold px-2 py-0.5 rounded-full">{unreadCount} chưa đọc</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="text-[10px] font-bold text-slate-400 hover:text-white disabled:opacity-50 flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck size={12} /> Đọc tất cả
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading && (
              <div className="py-10 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!loading && preview.length === 0 && (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-slate-500 text-xs">Bạn chưa có thông báo nào.</p>
              </div>
            )}

            {!loading &&
              preview.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleMarkRead(n)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-850/60 last:border-b-0 transition-colors cursor-pointer hover:bg-slate-850/40 ${
                    n.isRead ? '' : 'bg-slate-850/20'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />}
                    <div className={`min-w-0 flex-1 ${n.isRead ? 'pl-3.5' : ''}`}>
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <h4 className="font-bold text-white text-xs">{n.title}</h4>
                        <StatusBadge entity="notificationType" value={n.type} />
                      </div>
                      <p className="text-slate-400 text-[11px] leading-snug line-clamp-2">{n.content}</p>
                      <p className="text-slate-600 text-[10px] font-semibold mt-1">{formatRelativeTime(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))}
          </div>

          <button
            onClick={handleViewAll}
            className="w-full text-center py-3 text-[11px] font-bold text-orange-500 hover:text-orange-400 hover:bg-slate-850/40 transition-colors border-t border-slate-850 cursor-pointer"
          >
            Xem thêm thông báo
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
