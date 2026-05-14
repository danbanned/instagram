'use client';

import { SafeImage } from '../../utils/media';
import styles from './AboutAccountModal.module.css';

export default function AboutAccountModal({ profile, onClose }) {
  const joinedLabel = new Date(profile.createdAt || Date.now()).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  const previousUsernames = profile.previousUsernames || [];

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>About this account</h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close about account">
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.profileSummary}>
            <SafeImage
              src={profile.avatar || '/default-avatar.png'}
              alt={profile.username}
              className={styles.avatar}
            />
            <div>
              <div className={styles.username}>{profile.username}</div>
              <div className={styles.name}>{profile.name || profile.username}</div>
            </div>
          </div>

          <div className={styles.section}>
            <h3>About your account</h3>

            <div className={styles.detailRow}>
              <span className={styles.label}>Date joined</span>
              <span className={styles.value}>{joinedLabel}</span>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.label}>Account based in</span>
              <span className={styles.value}>{profile.location || 'United States'}</span>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.label}>Former usernames</span>
              <span className={styles.value}>
                {previousUsernames.length ? `${previousUsernames.length} >` : 'None'}
              </span>
            </div>
          </div>

          <div className={styles.helpText}>
            To help keep Instagram authentic, some profile details are shown so people can understand when an account was created and how it has changed over time.
          </div>
        </div>
      </div>
    </div>
  );
}
