import styles from './NotificationTabs.module.css';

export default function NotificationTabs({ activeTab, onTabChange }) {
  return (
    <div className={styles.tabs}>
      <button
        type="button"
        className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
        onClick={() => onTabChange('all')}
      >
        All Notifications
      </button>
      <button
        type="button"
        className={`${styles.tab} ${activeTab === 'comments' ? styles.active : ''}`}
        onClick={() => onTabChange('comments')}
      >
        Comments
      </button>
    </div>
  );
}
