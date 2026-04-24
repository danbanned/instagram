'use client';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PostGrid.module.css';

export default function PostGrid({ posts = [], type }) {
  const navigate = useNavigate();
  const [hoveredPost, setHoveredPost] = useState(null);

  const handlePostClick = (postId) => {
    navigate(`/post/${postId}`);
  };

  if (posts.length === 0) {
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
        {type === 'posts' && <p>When you share photos and videos, they'll appear here.</p>}
        {type === 'saved' && <p>Save posts you want to remember.</p>}
        {type === 'tagged' && <p>When people tag you in posts, they appear here.</p>}
      </div>
    );
  }

  return (
    <div className={styles.postGrid}>
      {posts.map(post => (
        <div 
          key={post.id}
          className={styles.gridItem}
          onMouseEnter={() => setHoveredPost(post.id)}
          onMouseLeave={() => setHoveredPost(null)}
          onClick={() => handlePostClick(post.id)}
        >
          {/* Media */}
          <div className={styles.mediaContainer}>
            {post.type === 'video' ? (
              <video src={post.mediaUrl} className={styles.media} />
            ) : (
              <img src={post.mediaUrl} alt={post.caption} className={styles.media} />
            )}
            
            {/* Carousel Indicator */}
            {post.type === 'carousel' && (
              <div className={styles.carouselIndicator}>📷 {post.mediaCount}</div>
            )}
            
            {/* Video Duration */}
            {post.type === 'video' && post.duration && (
              <div className={styles.duration}>{post.duration}</div>
            )}
          </div>

          {/* Hover Overlay with Stats */}
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
        </div>
      ))}
    </div>
  );
}
