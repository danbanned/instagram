'use client';

import { useState } from 'react';
import styles from './ProfileStats.module.css';

export default function ProfileStats({ stats, isOwnProfile }) {
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  return (
    <div className={styles.statsContainer}>
      <div className={styles.statItem}>
        <div className={styles.statValue}>{stats.postsCount?.toLocaleString() || 0}</div>
        <div className={styles.statLabel}>posts</div>
      </div>

      <button 
        className={styles.statItem}
        onClick={() => setShowFollowersModal(true)}
      >
        <div className={styles.statValue}>{stats.followersCount?.toLocaleString() || 0}</div>
        <div className={styles.statLabel}>followers</div>
      </button>

      <button 
        className={styles.statItem}
        onClick={() => setShowFollowingModal(true)}
      >
        <div className={styles.statValue}>{stats.followingCount?.toLocaleString() || 0}</div>
        <div className={styles.statLabel}>following</div>
      </button>

      {/* Followers Modal */}
      {showFollowersModal && (
        <div className={styles.modalOverlay} onClick={() => setShowFollowersModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Followers</h3>
              <button onClick={() => setShowFollowersModal(false)}>×</button>
            </div>
            <div className={styles.modalList}>
              {stats.followers?.length > 0 ? (
                stats.followers.map(follower => (
                  <div key={follower.id} className={styles.modalUser}>
                    <img src={follower.avatar || '/default-avatar.png'} alt={follower.username} />
                    <div>
                      <div className={styles.modalUsername}>{follower.username}</div>
                      <div className={styles.modalName}>{follower.name}</div>
                    </div>
                    <button className={styles.followButton}>
                      {follower.isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>
                ))
              ) : (
                <div className={styles.emptyModal}>No followers yet</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Similar Following Modal */}
      {showFollowingModal && (
        <div className={styles.modalOverlay} onClick={() => setShowFollowingModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Following</h3>
              <button onClick={() => setShowFollowingModal(false)}>×</button>
            </div>
            <div className={styles.modalList}>
              {stats.following?.length > 0 ? (
                stats.following.map(following => (
                  <div key={following.id} className={styles.modalUser}>
                    <img src={following.avatar || '/default-avatar.png'} alt={following.username} />
                    <div>
                      <div className={styles.modalUsername}>{following.username}</div>
                      <div className={styles.modalName}>{following.name}</div>
                    </div>
                    <button className={styles.followButton}>
                      {following.isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>
                ))
              ) : (
                <div className={styles.emptyModal}>Not following anyone yet</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
