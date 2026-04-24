'use client';

import { useEffect, useRef } from 'react';

export default function PostOptionsMenu({ post, isOpen, onClose, onAction }) {
  const menuRef = useRef(null);

  // Close when clicking outside
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

  if (!isOpen) return null;

  const menuItems = [
    { id: 'report', label: 'Report', icon: '📋', danger: false },
    { id: 'unfollow', label: 'Unfollow', icon: '🚫', danger: false },
    { id: 'favorite', label: 'Add to favorites', icon: '⭐', danger: false },
    { id: 'goToPost', label: 'Go to post', icon: '🔗', danger: false },
    { id: 'share', label: 'Share to...', icon: '📤', danger: false },
    { id: 'copyLink', label: 'Copy link', icon: '🔗', danger: false },
    { id: 'embed', label: 'Embed', icon: '📦', danger: false },
    { id: 'about', label: 'About this account', icon: 'ℹ️', danger: false },
  ];

  const handleAction = (actionId) => {
    onAction(actionId, post);
    onClose();
  };

  return (
    <>
      <div className="post-options-overlay" onClick={onClose} />
      <div className="post-options-menu" ref={menuRef}>
        {/* Header with author info */}
        <div className="menu-header">
          <span className="author-name">{post.author?.username}</span>
          <span className="dot-separator">·</span>
          <span className="post-time">{post.timeAgo || '1d'}</span>
        </div>

        <div className="menu-divider"></div>

        {/* Menu items */}
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`menu-item ${item.danger ? 'danger' : ''}`}
            onClick={() => handleAction(item.id)}
          >
            <span className="menu-icon">{item.icon}</span>
            <span className="menu-label">{item.label}</span>
          </button>
        ))}

        <div className="menu-divider"></div>

        {/* Cancel button */}
        <button className="menu-item cancel" onClick={onClose}>
          <span className="menu-label">Cancel</span>
        </button>
      </div>
    </>
  );
}
