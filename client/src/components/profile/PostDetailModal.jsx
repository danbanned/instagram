'use client';

import { useEffect, useMemo, useState } from 'react';
import { SafeImage, getMediaUrl } from '../../utils/media';
import PostOptionsMenu from '../PostOptionsMenu';
import styles from './PostDetailModal.module.css';

export default function PostDetailModal({ post, isOpen, isOwnProfile, onClose, onAction, onCommentSubmit }) {
  const [commentText, setCommentText] = useState('');
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCommentText('');
      setShowOptions(false);
    }
  }, [isOpen]);

  const likeLine = useMemo(() => {
    if (!post) return '';
    if (post.hideLikeCount) return 'Like count hidden';
    if (!post.likesCount) return 'Be the first to like this';
    return `Liked by ${post.likesCount.toLocaleString()} people`;
  }, [post]);

  if (!isOpen || !post) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!commentText.trim() || post.commentsDisabled) return;
    await onCommentSubmit?.(post.id, commentText.trim());
    setCommentText('');
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <section className={styles.modal}>
        <button type="button" className={styles.closeButton} onClick={onClose}>✕</button>
        <div className={styles.mediaPane}>
          {post.mediaType === 'video' || post.type === 'video' ? (
            <video src={getMediaUrl(post.mediaUrl)} controls className={styles.media} />
          ) : (
            <SafeImage src={post.mediaUrl} alt={post.caption || 'Post'} className={styles.media} />
          )}
        </div>

        <div className={styles.contentPane}>
          <header className={styles.header}>
            <div className={styles.authorRow}>
              <SafeImage src={post.author?.avatarUrl || post.user?.avatar} alt={post.author?.username || post.user?.username} className={styles.avatar} />
              <div>
                <div className={styles.username}>{post.author?.username || post.user?.username}</div>
                {post.location && <div className={styles.location}>{post.location}</div>}
              </div>
            </div>
            <button type="button" className={styles.menuButton} onClick={() => setShowOptions(true)}>⋮</button>
          </header>

          <div className={styles.captionBlock}>
            <span className={styles.captionUser}>{post.author?.username || post.user?.username}</span>
            <span>{post.caption || ''}</span>
          </div>

          <div className={styles.commentsSection}>
            {post.comments?.length ? (
              post.comments.map((comment) => (
                <div key={comment.id} className={styles.comment}>
                  <span className={styles.commentUser}>{comment.user?.username}</span>
                  <span>{comment.text}</span>
                </div>
              ))
            ) : (
              <div className={styles.emptyComments}>No comments yet.</div>
            )}
          </div>

          <div className={styles.actions}>
            <div className={styles.actionRow}>
              <button type="button" className={styles.iconButton}>❤️</button>
              <button type="button" className={styles.iconButton}>💬</button>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => onAction?.('share', post)}
              >
                ↗️
              </button>
            </div>
            <div className={styles.likes}>{likeLine}</div>
            <time className={styles.timestamp}>
              {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}
            </time>
          </div>

          <form className={styles.commentForm} onSubmit={handleSubmit}>
            <input
              type="text"
              className={styles.commentInput}
              placeholder={post.commentsDisabled ? 'Commenting is turned off' : 'Add a comment...'}
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              disabled={post.commentsDisabled}
            />
            <button type="submit" className={styles.postButton} disabled={!commentText.trim() || post.commentsDisabled}>
              Post
            </button>
          </form>
        </div>
      </section>

      <PostOptionsMenu
        post={post}
        isOpen={showOptions}
        isOwnProfile={isOwnProfile}
        onClose={() => setShowOptions(false)}
        onAction={onAction}
      />
    </>
  );
}
