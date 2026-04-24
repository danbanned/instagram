'use client';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ProfileHeader.module.css';

export default function ProfileHeader({ profile, isOwnProfile }) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleBack = () => {
    navigate(-1);
  };

  const handleEditProfile = () => {
    navigate(`/profile/${profile.userId}/edit`);
  };

  const handleShareProfile = () => {
    navigator.clipboard.writeText(`${window.location.origin}/profile/${profile.userId}`);
    alert('Profile link copied!');
  };

  const handleMenuAction = (action) => {
    if (action === 'report') alert('Report user');
    if (action === 'block') alert('Block user');
    if (action === 'copyLink') handleShareProfile();
    if (action === 'settings') navigate('/settings');
    setShowMenu(false);
  };

  return (
    <div className={styles.profileHeader}>
      {/* Top Navigation Bar */}
      <div className={styles.topNav}>
        <button onClick={handleBack} className={styles.backButton}>←</button>
        <h1 className={styles.username}>{profile.username}</h1>
        <div className={styles.headerActions}>
          <button onClick={handleShareProfile} className={styles.shareButton}>
            Share Profile
          </button>
          {isOwnProfile ? (
            <button onClick={handleEditProfile} className={styles.editButton}>
              Edit Profile
            </button>
          ) : (
            <>
              <button className={styles.followButton}>
                {profile.isFollowing ? 'Following' : 'Follow'}
              </button>
              <button className={styles.messageButton}>Message</button>
            </>
          )}
          <button 
            className={styles.menuButton}
            onClick={() => setShowMenu(!showMenu)}
          >
            ⋮
          </button>
        </div>
      </div>

      {/* Three Dots Menu */}
      {showMenu && (
        <div className={styles.menuOverlay} onClick={() => setShowMenu(false)}>
          <div className={styles.menuCard}>
            {isOwnProfile ? (
              <>
                <button onClick={() => handleMenuAction('settings')}>Settings</button>
                <button onClick={() => handleMenuAction('archive')}>Archive</button>
                <button onClick={() => handleMenuAction('insights')}>Insights</button>
                <button onClick={() => handleMenuAction('qrCode')}>QR Code</button>
              </>
            ) : (
              <>
                <button onClick={() => handleMenuAction('report')}>Report</button>
                <button onClick={() => handleMenuAction('block')}>Block</button>
                <button onClick={() => handleMenuAction('copyLink')}>Copy Link</button>
                <button onClick={() => handleMenuAction('about')}>About this account</button>
              </>
            )}
            <div className={styles.divider}></div>
            <button className={styles.cancelButton} onClick={() => setShowMenu(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Avatar & Bio Section */}
      <div className={styles.profileInfo}>
        <div className={styles.avatarSection}>
          <div className={`${styles.avatarRing} ${profile.hasStory ? styles.hasStory : ''}`}>
            <img 
              src={profile.avatar || '/default-avatar.png'} 
              alt={profile.username}
              className={styles.avatar}
            />
          </div>
        </div>

        <div className={styles.bioSection}>
          <h2 className={styles.name}>{profile.name || profile.username}</h2>
          <p className={styles.bio}>{profile.bio}</p>
          {profile.website && (
            <a 
              href={profile.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.website}
            >
              🔗 {profile.website.replace('https://', '')}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
