'use client';

import { useMemo, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import api from '../../services/api';
import { SafeImage } from '../../utils/media';
import styles from './FollowList.module.css';

const PAGE_SIZE = 20;

export default function FollowList({ type, profileUserId, users = [], onUsersChange }) {
  const { user: currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [pendingIds, setPendingIds] = useState([]);

  const isOwnProfile = currentUser?.id === profileUserId;
  const normalizedQuery = query.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    if (!normalizedQuery) return users;

    return users.filter((entry) => {
      const username = entry.username?.toLowerCase() || '';
      const name = entry.name?.toLowerCase() || '';
      return username.includes(normalizedQuery) || name.includes(normalizedQuery);
    });
  }, [normalizedQuery, users]);

  const visibleUsers = filteredUsers.slice(0, visibleCount);

  const setPending = (userId, pending) => {
    setPendingIds((prev) => (
      pending ? [...prev, userId] : prev.filter((id) => id !== userId)
    ));
  };

  const handleToggleFollow = async (targetUserId) => {
    setPending(targetUserId, true);
    try {
      const response = await api.post(`/posts/users/${targetUserId}/follow`);
      onUsersChange?.((prev) => {
        const isNowFollowing = !!response.data.following;

        if (type === 'following' && isOwnProfile && !isNowFollowing) {
          return prev.filter((entry) => entry.id !== targetUserId);
        }

        return prev.map((entry) => (
          entry.id === targetUserId
            ? { ...entry, isFollowing: isNowFollowing }
            : entry
        ));
      });
    } catch (error) {
      console.error('Failed to update follow state:', error);
    } finally {
      setPending(targetUserId, false);
    }
  };

  const handleRemoveFollower = async (followerId) => {
    const confirmed = window.confirm('Remove this follower?');
    if (!confirmed) return;

    setPending(followerId, true);
    try {
      await api.delete(`/users/followers/${followerId}`);
      onUsersChange?.((prev) => prev.filter((entry) => entry.id !== followerId));
    } catch (error) {
      console.error('Failed to remove follower:', error);
    } finally {
      setPending(followerId, false);
    }
  };

  const getActionLabel = (entry) => {
    if (type === 'followers' && isOwnProfile) return 'Remove';
    return entry.isFollowing ? 'Following' : 'Follow';
  };

  return (
    <div className={styles.followList}>
      <div className={styles.searchRow}>
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          placeholder="Search"
          className={styles.searchInput}
        />
      </div>

      <div className={styles.list}>
        {!filteredUsers.length && (
          <div className={styles.emptyState}>No results found.</div>
        )}

        {visibleUsers.map((entry) => {
          const isPending = pendingIds.includes(entry.id);
          const showRemove = type === 'followers' && isOwnProfile;

          return (
            <div key={entry.id} className={styles.item}>
              <div className={styles.identity}>
                <SafeImage
                  src={entry.avatar || '/default-avatar.png'}
                  alt={entry.username}
                  className={styles.avatar}
                />
                <div className={styles.meta}>
                  <div className={styles.username}>{entry.username}</div>
                  <div className={styles.name}>{entry.name || entry.username}</div>
                </div>
              </div>

              {entry.id !== currentUser?.id && (
                <button
                  type="button"
                  disabled={isPending}
                  className={showRemove ? styles.removeButton : `${styles.followButton} ${entry.isFollowing ? styles.following : ''}`}
                  onClick={() => (showRemove ? handleRemoveFollower(entry.id) : handleToggleFollow(entry.id))}
                >
                  {isPending ? 'Working...' : getActionLabel(entry)}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {visibleCount < filteredUsers.length && (
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.loadMoreButton}
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
