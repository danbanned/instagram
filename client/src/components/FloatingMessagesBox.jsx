import { useNavigate, useLocation } from 'react-router-dom';
import { useUnreadCount } from '../hooks/useUnreadCount';
import styles from './FloatingMessagesBox.module.css';

export default function FloatingMessagesBox() {
  const navigate = useNavigate();
  const location = useLocation();
  const unreadCount = useUnreadCount();

  if (location.pathname.startsWith('/messages')) return null;

  return (
    <button
      className={styles.floatingBox}
      onClick={() => navigate('/messages')}
      aria-label={`Messages${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
    >
      <span className={styles.messageIcon}>💬</span>
      {unreadCount > 0 && (
        <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
      )}
    </button>
  );
}
