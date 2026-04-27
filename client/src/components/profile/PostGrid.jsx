'use client';

import { useMemo, useState } from 'react';
import { SafeImage, getMediaUrl } from '../../utils/media';
import PostOptionsMenu from '../PostOptionsMenu';
import styles from './PostGrid.module.css';

export default function PostGrid({ posts = [], type, isOwnProfile, onPostClick, onPostAction }) {
  const [hoveredPost, setHoveredPost] = useState(null);
  const [menuPost, setMenuPost] = useState(null);

  const sortedPosts = useMemo(() => {
    const items = [...posts];
    items.sort((a, b) => {
      if (!!a.isPinned !== !!b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
    return items;
  }, [posts]);

  if (sortedPosts.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          {type === 'posts' && '📷'}
          {type === 'reels' && '🎬'}
          {type === 'saved' && '📌'}
          {type === 'reposts' && '↪️'}
          {type === 'tagged' && '🏷️'}
        </div>
        <h3>No {type} yet</h3>
        {type === 'posts' && <p>When you share photos and videos, they&apos;ll appear here.</p>}
        {type === 'saved' && <p>Save posts you want to remember.</p>}
        {type === 'tagged' && <p>When people tag you in posts, they appear here.</p>}
      </div>
    );
  }

  return (
    <>
      <div className={styles.postGrid}>
        {sortedPosts.map((post) => (
          <article
            key={post.id}
            className={styles.gridItem}
            onMouseEnter={() => setHoveredPost(post.id)}
            onMouseLeave={() => setHoveredPost(null)}
            onClick={() => onPostClick?.(post)}
          >
            <div className={styles.mediaContainer}>
              {post.type === 'video' ? (
                <video src={getMediaUrl(post.mediaUrl)} className={styles.media} muted playsInline />
              ) : (
                <SafeImage src={post.mediaUrl} alt={post.caption || 'Post'} className={styles.media} />
              )}

              {post.isPinned && <div className={styles.pinIcon}>📌</div>}

              {isOwnProfile && (
                <button
                  type="button"
                  className={styles.menuButton}
                  aria-label="Post options"
                  onClick={(event) => {
                    event.stopPropagation();
                    setMenuPost(post);
                  }}
                >
                  ⋮
                </button>
              )}

              {post.type === 'carousel' && (
                <div className={styles.carouselIndicator}>📷 {post.mediaCount}</div>
              )}

              {post.type === 'video' && post.duration && (
                <div className={styles.duration}>{post.duration}</div>
              )}
            </div>

            {hoveredPost === post.id && (
              <div className={styles.hoverOverlay}>
                <div className={styles.statsContainer}>
                  <div className={styles.stat}>
                    <span className={styles.statIcon}>❤️</span>
                    <span className={styles.statValue}>{post.likesCount?.toLocaleString() || 0}</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statIcon}>💬</span>
                    <span className={styles.statValue}>{post.commentsCount?.toLocaleString() || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>

      <PostOptionsMenu
        post={menuPost}
        isOpen={!!menuPost}
        isOwnProfile={isOwnProfile}
        onClose={() => setMenuPost(null)}
        onAction={onPostAction}
      />
    </>
  );
}
