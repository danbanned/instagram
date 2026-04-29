'use client';

import styles from './ProfileTabs.module.css';

export default function ProfileTabs({ activeTab, onTabChange, isOwnProfile }) {
  const tabs = [
    { id: 'posts', label: 'Posts', icon: '📷' },
    { id: 'reels', label: 'Reels', icon: '🎬' },
    { id: 'saved', label: 'Saved', icon: '📌' },
    { id: 'reposts', label: 'Reposts', icon: '🔄' }
  ];

  const visibleTabs = isOwnProfile ? tabs : tabs.filter(t => t.id !== 'saved');

  return (
    <div className={styles.tabsContainer}>
      {visibleTabs.map(tab => (
        <button
          key={tab.id}
          className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className={styles.tabIcon}>{tab.icon}</span>
          <span className={styles.tabLabel}>{tab.label}</span>
          {activeTab === tab.id && <div className={styles.activeIndicator} />}
        </button>
      ))}
    </div>
  );
}
