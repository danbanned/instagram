import { Link } from 'react-router-dom';
import styles from './NotificationItem.module.css';

function formatTimeAgo(date) {
  const diffSeconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diffSeconds < 60) return 'Just now';
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h`;
  if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d`;
  if (diffSeconds < 2592000) return `${Math.floor(diffSeconds / 604800)}w`;
  if (diffSeconds < 31536000) return `${Math.floor(diffSeconds / 2592000)}mo`;
  return `${Math.floor(diffSeconds / 31536000)}y`;
}

function getIcon(type) {
  if (type === 'like_post' || type === 'like_comment') return '❤️';
  if (type === 'comment') return '💬';
  if (type === 'mention') return '@';
  if (type === 'follow') return '👤';
  if (type === 'story_like') return '📖';
  return '🔔';
}

function getText(notification) {
  if (notification.message) return notification.message;

  switch (notification.type) {
    case 'follow':
      return `${notification.sender?.username} started following you.`;
    case 'mention':
      return `${notification.sender?.username} mentioned you.`;
    case 'comment':
      return `${notification.sender?.username} commented on your post.`;
    default:
      return `${notification.sender?.username} interacted with your post.`;
  }
}

function getLink(notification) {
  if (notification.post?.id) return `/profile/${notification.sender?.id}`;
  return `/profile/${notification.sender?.id}`;
}

export default function NotificationItem({ notification, onMarkRead }) {
  return (
    <Link
      to={getLink(notification)}
      className={`${styles.notificationItem} ${!notification.isRead ? styles.unread : ''}`}
      onClick={() => onMarkRead(notification.id)}
    >
      <div className={styles.avatar}>
        <img src={notification.sender?.avatarUrl || notification.sender?.avatar || '/default-avatar.png'} alt={notification.sender?.username || 'notification'} />
        <span className={styles.icon}>{getIcon(notification.type)}</span>
      </div>
      <div className={styles.content}>
        <div className={styles.text}>{getText(notification)}</div>
        <div className={styles.time}>{formatTimeAgo(notification.createdAt)}</div>
      </div>
      {!notification.isRead && <div className={styles.unreadDot} />}
    </Link>
  );
}
