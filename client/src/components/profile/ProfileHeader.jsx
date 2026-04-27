'use client';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SafeImage } from '../../utils/media';
import styles from './ProfileHeader.module.css';

export default function ProfileHeader({ profile, stats, isOwnProfile, onOpenEditProfile, onOpenArchive }) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleShareProfile = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/profile/${profile.userId}`);
    alert('Profile link copied!');
  };

  const handleMenuAction = (action) => {
    if (action === 'settings') navigate('/settings');
    if (action === 'archive') onOpenArchive?.();
    if (action === 'copyLink') handleShareProfile();
    if (action === 'report') alert('Report user');
    if (action === 'block') alert('Block user');
    setShowMenu(false);
  };

  return (
    <header className={styles.profileHeader}>
      <div className={styles.avatarColumn}>
        <div className={`${styles.avatarRing} ${profile.hasStory ? styles.hasStory : ''}`}>
          <SafeImage
            src={profile.avatar || '/default-avatar.png'}
            alt={profile.username}
            className={styles.avatar}
          />
        </div>
      </div>

      <div className={styles.detailsColumn}>
        <div className={styles.usernameRow}>
          <h1 className={styles.username}>{profile.username}</h1>
          {isOwnProfile ? (
            <>
              <button type="button" className={styles.inlineButton} onClick={onOpenEditProfile}>
                Edit profile
              </button>
              <button type="button" className={styles.inlineButton} onClick={onOpenArchive}>
                View archive
              </button>
              <button
                type="button"
                className={styles.iconButton}
                aria-label="Settings"
                onClick={() => navigate('/settings')}
              >
                ⚙️
              </button>
            </>
          ) : (
            <>
              <button type="button" className={styles.followButton}>
                {profile.isFollowing ? 'Following' : 'Follow'}
              </button>
              <button type="button" className={styles.inlineButton}>
                Message
              </button>
              <button type="button" className={styles.iconButton} onClick={() => setShowMenu(true)}>
                ⋮
              </button>
            </>
          )}
        </div>

        <div className={styles.statsRow}>
          <span className={styles.stat}>
            <strong>{stats?.postsCount?.toLocaleString() || 0}</strong> posts
          </span>
          <span className={styles.stat}>
            <strong>{stats?.followersCount?.toLocaleString() || 0}</strong> followers
          </span>
          <span className={styles.stat}>
            <strong>{stats?.followingCount?.toLocaleString() || 0}</strong> following
          </span>
        </div>

        <div className={styles.bioSection}>
          <div className={styles.name}>{profile.name || 'Daniel Johnson'}</div>
          <p className={styles.bio}>{profile.bio || 'Leave me be 2020-2021\nAlmost there, 2022'}</p>
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noreferrer"
              className={styles.website}
            >
              {profile.website.replace('https://', '')}
            </a>
          )}
        </div>

        {isOwnProfile && (
          <div className={styles.mobileActions}>
            <button type="button" className={styles.inlineButton} onClick={onOpenEditProfile}>
              Edit profile
            </button>
            <button type="button" className={styles.inlineButton} onClick={onOpenArchive}>
              View archive
            </button>
          </div>
        )}
      </div>

      {showMenu && (
        <div className={styles.menuOverlay} onClick={() => setShowMenu(false)}>
          <div className={styles.menuCard} onClick={(event) => event.stopPropagation()}>
            {isOwnProfile ? (
              <>
                <button type="button" onClick={() => handleMenuAction('settings')}>Settings</button>
                <button type="button" onClick={() => handleMenuAction('archive')}>Archive</button>
                <button type="button" onClick={() => handleMenuAction('copyLink')}>Copy link</button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => handleMenuAction('report')}>Report</button>
                <button type="button" onClick={() => handleMenuAction('block')}>Block</button>
                <button type="button" onClick={() => handleMenuAction('copyLink')}>Copy link</button>
              </>
            )}
            <div className={styles.divider} />
            <button type="button" className={styles.cancelButton} onClick={() => setShowMenu(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
