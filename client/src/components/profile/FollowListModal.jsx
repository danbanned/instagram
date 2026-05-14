'use client';

import FollowList from './FollowList';
import styles from './FollowListModal.module.css';

export default function FollowListModal({ type, profileUserId, users, onClose, onUsersChange }) {
  const title = type === 'followers' ? 'Followers' : 'Following';

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{title}</h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label={`Close ${title}`}>
            ×
          </button>
        </div>

        <FollowList
          type={type}
          profileUserId={profileUserId}
          users={users}
          onUsersChange={onUsersChange}
        />
      </div>
    </div>
  );
}
