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

  return notifications.reduce((acc, notification) => {
    const age = now - new Date(notification.createdAt).getTime();
    if (age < day) acc.today.push(notification);
    else if (age < week) acc.thisWeek.push(notification);
    else if (age < month) acc.thisMonth.push(notification);
    else acc.older.push(notification);
    return acc;
  }, { today: [], thisWeek: [], thisMonth: [], older: [] });
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const grouped = useMemo(() => groupNotifications(notifications), [notifications]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchNotifications({ type: activeTab });
        setNotifications(data.notifications || []);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [activeTab]);

  useSocket(user?.id, (notification) => {
    setNotifications((prev) => [notification, ...prev]);
  });

  const handleMarkRead = async (id) => {
    setNotifications((prev) => prev.map((notification) => (
      notification.id === id ? { ...notification, isRead: true } : notification
    )));

    try {
      await markNotificationRead(id);
    } catch (error) {
      console.error('Failed to mark notification read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
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

        <div className={styles.infoBox}>
          <span>🔔</span>
          <div>
            <strong>Activity On Your Posts</strong>
            <p>When someone likes or comments on one of your posts, you&apos;ll see it here.</p>
          </div>
        </div>

        <div className={styles.notificationsList}>
          <NotificationGroup title="Today" notifications={grouped.today} onMarkRead={handleMarkRead} />
          <NotificationGroup title="This week" notifications={grouped.thisWeek} onMarkRead={handleMarkRead} />
          <NotificationGroup title="This month" notifications={grouped.thisMonth} onMarkRead={handleMarkRead} />
          <NotificationGroup title="Older" notifications={grouped.older} onMarkRead={handleMarkRead} />
          {!notifications.length && <div className={styles.empty}>No notifications yet.</div>}
        </div>

        <SuggestedUsers />
      </div>
    </main>
  );
}
