import { useEffect, useMemo, useState } from 'react';
import NotificationGroup from '../components/notifications/NotificationGroup';
import NotificationTabs from '../components/notifications/NotificationTabs';
import SuggestedUsers from '../components/notifications/SuggestedUsers';
import useSocket from '../hooks/useSocket';
import useAuth from '../hooks/useAuth';
import { fetchNotifications, markNotificationRead, markNotificationsRead } from '../services/notificationService';
import styles from './NotificationsPage.module.css';

function groupNotifications(notifications) {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const week = 7 * day;
  const month = 30 * day;

  return notifications.reduce((acc, n) => {
    if (!n.isRead) {
      acc.unread.push(n);
    } else {
      const age = now - new Date(n.createdAt).getTime();
      if (age < day) acc.today.push(n);
      else if (age < week) acc.thisWeek.push(n);
      else if (age < month) acc.thisMonth.push(n);
      else acc.older.push(n);
    }
    return acc;
  }, { unread: [], today: [], thisWeek: [], thisMonth: [], older: [] });
}

// Client-side filter for tab types the API may not handle
function filterByTab(notifications, tab) {
  switch (tab) {
    case 'comments':  return notifications.filter(n => n.type === 'comment');
    case 'follows':   return notifications.filter(n => n.type === 'follow');
    case 'mentions':  return notifications.filter(n => n.type === 'mention');
    default:          return notifications;
  }
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [allNotifications, setAllNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const notifications = useMemo(
    () => filterByTab(allNotifications, activeTab),
    [allNotifications, activeTab]
  );

  const grouped = useMemo(() => groupNotifications(notifications), [notifications]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchNotifications({ type: activeTab });
        setAllNotifications(data.notifications || []);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [activeTab]);

  useSocket(user?.id, (notification) => {
    setAllNotifications((prev) => [notification, ...prev]);
  });

  const handleMarkRead = async (id) => {
    setAllNotifications((prev) => prev.map((n) =>
      n.id === id ? { ...n, isRead: true } : n
    ));
    try {
      await markNotificationRead(id);
    } catch (error) {
      console.error('Failed to mark notification read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    setAllNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await markNotificationsRead();
    } catch (error) {
      console.error('Failed to mark all notifications read:', error);
    }
  };

  if (loading) return <div className={styles.loading}>Loading notifications...</div>;

  return (
    <main className={styles.notificationsContainer}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h1>Notifications</h1>
          {!!notifications.length && (
            <button type="button" onClick={handleMarkAllRead} className={styles.markAllRead}>
              Mark all as read
            </button>
          )}
        </div>

        <NotificationTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className={styles.notificationsList}>
          <NotificationGroup title="New" notifications={grouped.unread} onMarkRead={handleMarkRead} />
          <NotificationGroup title="Today" notifications={grouped.today} onMarkRead={handleMarkRead} />
          <NotificationGroup title="This week" notifications={grouped.thisWeek} onMarkRead={handleMarkRead} />
          <NotificationGroup title="This month" notifications={grouped.thisMonth} onMarkRead={handleMarkRead} />
          <NotificationGroup title="Earlier" notifications={grouped.older} onMarkRead={handleMarkRead} />
          {!notifications.length && <div className={styles.empty}>No notifications yet.</div>}
        </div>
      </div>

      <div className={styles.sidebar}>
        <SuggestedUsers />
      </div>
    </main>
  );
}
