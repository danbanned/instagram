import { useEffect, useState } from 'react';
import api from '../services/api';
import styles from './FollowButton.module.css';

const FOLLOW_EVENT = 'follow:changed';

export function emitFollowChange(detail) {
  window.dispatchEvent(new CustomEvent(FOLLOW_EVENT, { detail }));
}

export default function FollowButton({
  userId,
  initialIsFollowing = false,
  onFollowChange,
  variant = 'default',
  className = ''
}) {
  const [isFollowing, setIsFollowing] = useState(!!initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsFollowing(!!initialIsFollowing);
  }, [initialIsFollowing]);

  useEffect(() => {
    const handleFollowEvent = (event) => {
      if (String(event.detail?.userId) !== String(userId)) return;
      const nextState = !!event.detail?.isFollowing;
      setIsFollowing(nextState);
      onFollowChange?.(nextState, { source: 'event' });
    };

    window.addEventListener(FOLLOW_EVENT, handleFollowEvent);
    return () => window.removeEventListener(FOLLOW_EVENT, handleFollowEvent);
  }, [onFollowChange, userId]);

  const handleToggle = async () => {
    if (isLoading) return;

    const nextState = !isFollowing;
    setIsLoading(true);
    setIsFollowing(nextState);
    onFollowChange?.(nextState, { source: 'local' });
    emitFollowChange({ userId, isFollowing: nextState });

    try {
      const response = await api.post(`/posts/users/${userId}/follow`);
      const resolvedState = !!response.data.following;
      setIsFollowing(resolvedState);
      onFollowChange?.(resolvedState, { source: 'server' });
      emitFollowChange({ userId, isFollowing: resolvedState });
    } catch (error) {
      console.error('Follow toggle failed:', error);
      setIsFollowing(!nextState);
      onFollowChange?.(!nextState, { source: 'rollback' });
      emitFollowChange({ userId, isFollowing: !nextState });
    } finally {
      setIsLoading(false);
    }
  };

  const classes = variant === 'chip'
    ? `${styles.chipButton} ${isFollowing ? styles.following : ''} ${className}`.trim()
    : `${styles.followButton} ${isFollowing ? styles.following : ''} ${className}`.trim();

  return (
    <button type="button" onClick={handleToggle} disabled={isLoading} className={classes}>
      {isLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}
