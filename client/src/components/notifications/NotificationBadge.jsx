import { useEffect, useState } from 'react';
import { fetchUnreadNotificationCount } from '../../services/notificationService';
import useAuth from '../../hooks/useAuth';
import useSocket from '../../hooks/useSocket';
import styles from './NotificationBadge.module.css';

export default function NotificationBadge() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    const loadCount = async () => {
      try {
        const data = await fetchUnreadNotificationCount();
        setCount(data.count || 0);
      } catch (error) {
        console.error('Failed to load unread notification count:', error);
      }
    };

    loadCount();
  }, [user?.id]);

  useSocket(user?.id, () => {
    setCount((prev) => prev + 1);
  });

  if (!count) return null;
  return <span className={styles.badge}>{count > 9 ? '9+' : count}</span>;
}
