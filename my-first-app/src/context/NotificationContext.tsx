/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getMyNotifications } from '../api/notification';
import { useAuth } from './useAuth';

const POLL_MS = 30000;

interface NotificationCountContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationCountContext = createContext<NotificationCountContextType | undefined>(undefined);

// Đếm số thông báo chưa đọc dùng chung cho cả chuông trên Header lẫn trang Thông báo — để khi
// đánh dấu đã đọc ở trang Thông báo, chuông cập nhật ngay thay vì phải chờ tối đa 30s poll.
export const NotificationCountProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await getMyNotifications();
      setUnreadCount(res.data.filter((n) => !n.isRead).length);
    } catch {
      // Bỏ qua lỗi polling nền, không làm phiền user bằng banner lỗi.
    }
  };

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <NotificationCountContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </NotificationCountContext.Provider>
  );
};

export const useNotificationCount = () => {
  const ctx = useContext(NotificationCountContext);
  if (!ctx) {
    throw new Error('useNotificationCount phải được dùng bên trong NotificationCountProvider');
  }
  return ctx;
};
