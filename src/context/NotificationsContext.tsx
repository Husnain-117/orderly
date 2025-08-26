import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

export type NotificationItem = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
};

type Ctx = {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markUnread: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  clearAll: () => Promise<void>;
};

const NotificationsContext = createContext<Ctx | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await api.notifications.list();
      setNotifications(res.notifications || []);
    } catch (e) {
      // Log to help diagnose issues (auth/CORS/proxy)
      // eslint-disable-next-line no-console
      console.error('[Notifications] Failed to fetch notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id: string) => {
    try {
      await api.notifications.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[Notifications] Failed to mark read:', e);
    }
  };

  const markUnread = async (id: string) => {
    try {
      await api.notifications.markUnread(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[Notifications] Failed to mark unread:', e);
    }
  };

  const markAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[Notifications] Failed to mark all read:', e);
    }
  };

  const clearAll = async () => {
    try {
      await api.notifications.clearAll();
      setNotifications([]);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[Notifications] Failed to clear notifications:', e);
    }
  };

  useEffect(() => {
    // initial fetch
    refresh();
    // simple polling every 20s
    const t = setInterval(refresh, 20000);
    return () => clearInterval(t);
  }, []);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const value = useMemo<Ctx>(
    () => ({ notifications, unreadCount, loading, refresh, markRead, markUnread, markAllRead, clearAll }),
    [notifications, unreadCount, loading]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
