import styles from './NotificationTabs.module.css';

const TABS = [
  { key: 'all',       label: 'All' },
  { key: 'following', label: 'People you follow' },
  { key: 'comments',  label: 'Comments' },
  { key: 'follows',   label: 'Follows' },
  { key: 'mentions',  label: 'Tags and mentions' },
  { key: 'verified',  label: 'Verified' },
];

export default function NotificationTabs({ activeTab, onTabChange }) {
  return (
    <div className={styles.tabs}>
      {TABS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          className={`${styles.tab} ${activeTab === key ? styles.active : ''}`}
          onClick={() => onTabChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
