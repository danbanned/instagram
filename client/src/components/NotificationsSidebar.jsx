import { useEffect, useMemo, useState } from 'react';
import NotificationGroup from './notifications/NotificationGroup';
import NotificationTabs from './notifications/NotificationTabs';
import { fetchNotifications, markNotificationRead, markNotificationsRead } from '../services/notificationService';
import styles from './NotificationsSidebar.module.css';

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

function filterByTab(notifications, tab) {
  switch (tab) {
    case 'comments': return notifications.filter(n => n.type === 'comment');
    case 'follows':  return notifications.filter(n => n.type === 'follow');
    case 'mentions': return notifications.filter(n => n.type === 'mention');
    default:         return notifications;
  }
}

export default function NotificationsSidebar({ isOpen, onClose }) {
  const [allNotifications, setAllNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const notifications = useMemo(
    () => filterByTab(allNotifications, activeTab),
    [allNotifications, activeTab]
  );
  const grouped = useMemo(() => groupNotifications(notifications), [notifications]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchNotifications({ type: activeTab });
        if (!cancelled) setAllNotifications(data.notifications || []);
      } catch (e) {
        console.error('NotificationsSidebar fetch failed:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleMarkRead = async (id) => {
    setAllNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    try { await markNotificationRead(id); } catch {}
  };

  const handleMarkAllRead = async () => {
    setAllNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try { await markNotificationsRead(); } catch {}
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />

      <div className={styles.sidebar} role="dialog" aria-label="Notifications">
        <div className={styles.header}>
          <h2 className={styles.title}>Notifications</h2>
          <div className={styles.headerRight}>
            {!!allNotifications.length && (
              <button className={styles.markAllRead} onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className={styles.tabsWrap}>
          <NotificationTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <div className={styles.list}>
          {loading ? (
            <div className={styles.loading}>Loading...</div>
          ) : (
            <>
              <NotificationGroup title="New"        notifications={grouped.unread}    onMarkRead={handleMarkRead} />
              <NotificationGroup title="Today"      notifications={grouped.today}     onMarkRead={handleMarkRead} />
              <NotificationGroup title="This week"  notifications={grouped.thisWeek}  onMarkRead={handleMarkRead} />
              <NotificationGroup title="This month" notifications={grouped.thisMonth} onMarkRead={handleMarkRead} />
              <NotificationGroup title="Earlier"    notifications={grouped.older}     onMarkRead={handleMarkRead} />
              {!notifications.length && (
                <div className={styles.empty}>No notifications yet.</div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
