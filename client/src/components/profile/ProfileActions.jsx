'use client';

import { useNavigate } from 'react-router-dom';
import styles from './ProfileActions.module.css';

export default function ProfileActions({ profile, isOwnProfile, onEditProfile, onViewArchive }) {
  const navigate = useNavigate();

  const actions = isOwnProfile ? [
    { id: 'edit', label: 'Edit Profile', icon: '✏️', onClick: () => onEditProfile?.() },
    { id: 'archive', label: 'View Archive', icon: '📦', onClick: () => onViewArchive?.() },
    { id: 'share', label: 'Share Profile', icon: '📤', onClick: () => {
      navigator.clipboard.writeText(`${window.location.origin}/profile/${profile.userId}`);
      alert('Profile link copied!');
    }},
    { id: 'settings', label: 'Settings', icon: '⚙️', onClick: () => navigate('/settings') }
  ] : [
    { id: 'follow', label: profile.isFollowing ? 'Following' : 'Follow', icon: '➕', onClick: () => alert('Follow action') },
    { id: 'message', label: 'Message', icon: '💬', onClick: () => navigate(`/messages/${profile.userId}`) },
    { id: 'share', label: 'Share Profile', icon: '📤', onClick: () => {
      navigator.clipboard.writeText(`${window.location.origin}/profile/${profile.userId}`);
      alert('Profile link copied!');
    }}
  ];

  return (
    <div className={styles.actionsContainer}>
      {actions.map(action => (
        <button 
          key={action.id}
          className={styles.actionButton}
          onClick={action.onClick}
        >
          <span className={styles.actionIcon}>{action.icon}</span>
          <span className={styles.actionLabel}>{action.label}</span>
        </button>
      ))}
    </div>
  );
}
