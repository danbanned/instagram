'use client';

import { useEffect, useRef } from 'react';
import styles from './PostOptionsMenu.module.css';

export default function PostOptionsMenu({ post, isOpen, isOwnProfile, onClose, onAction }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !post) return null;

  const ownItems = [
    { id: 'delete', label: 'Delete', danger: true },
    { id: 'edit', label: 'Edit' },
    { id: 'toggleLikeVisibility', label: post.hideLikeCount ? 'Show like count to others' : 'Hide like count to others' },
    { id: 'toggleComments', label: post.commentsDisabled ? 'Turn on commenting' : 'Turn off commenting' },
    { id: 'goToPost', label: 'Go to post' },
    { id: 'share', label: 'Share to...' },
    { id: 'copyLink', label: 'Copy link' },
    { id: 'embed', label: 'Embed' },
    { id: 'about', label: 'About this account' },
    { id: 'pin', label: post.isPinned ? 'Unpin from profile' : 'Pin to profile' },
  ];

  const publicItems = [
    { id: 'goToPost', label: 'Go to post' },
    { id: 'share', label: 'Share to...' },
    { id: 'copyLink', label: 'Copy link' },
    { id: 'embed', label: 'Embed' },
    { id: 'about', label: 'About this account' },
  ];

  const items = isOwnProfile ? ownItems : publicItems;

  const handleAction = (actionId) => {
    onAction?.(actionId, post);
    onClose();
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.menu} ref={menuRef}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`${styles.menuItem} ${item.danger ? styles.danger : ''}`}
            onClick={() => handleAction(item.id)}
          >
            {item.label}
          </button>
        ))}
        <div className={styles.divider} />
        <button type="button" className={styles.menuItem} onClick={onClose}>
          Cancel
        </button>
      </div>
    </>
  );
}
