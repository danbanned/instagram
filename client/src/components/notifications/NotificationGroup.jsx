import NotificationItem from './NotificationItem';
import styles from './NotificationGroup.module.css';

export default function NotificationGroup({ title, notifications, onMarkRead }) {
  if (!notifications.length) return null;

  return (
    <section className={styles.group}>
      <h3 className={styles.groupTitle}>{title}</h3>
      <div className={styles.notifications}>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkRead={onMarkRead}
          />
        ))}
      </div>
    </section>
  );
}
