import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';
import { SafeImage } from '../utils/media';
import { timeAgo } from '../utils/timeAgo';
import api from '../services/api';
import styles from './CommentsModal.module.css';

function addReplyInTree(comments, targetId, reply) {
  return comments.map((c) => {
    if (c.id === targetId) {
      return { ...c, replies: [...(c.replies || []), reply] };
    }
    if (c.replies?.length) {
      return { ...c, replies: addReplyInTree(c.replies, targetId, reply) };
    }
    return c;
  });
}

function removeFromTree(comments, commentId) {
  return comments
    .filter((c) => c.id !== commentId)
    .map((c) => ({
      ...c,
      replies: c.replies ? removeFromTree(c.replies, commentId) : [],
    }));
}

export default function CommentsModal({ post, isOpen, onClose, currentUser }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [submitError, setSubmitError] = useState('');

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/posts/${post.id}/comments`);
      setComments(data.comments || []);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      setSubmitError('Failed to load comments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [post?.id]);

  useEffect(() => {
    if (isOpen && post) {
      fetchComments();
    }
  }, [isOpen, post, fetchComments]);

  // Lock body scroll + Escape key when open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  const handleAddComment = async (text) => {
    setSubmitError('');
    try {
      const { data } = await api.post(`/posts/${post.id}/comments`, {
        text,
        parentId: replyingTo?.id || null,
      });

      if (replyingTo) {
        setComments((prev) => addReplyInTree(prev, replyingTo.id, data));
        setReplyingTo(null);
      } else {
        setComments((prev) => [data, ...prev]);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.errors?.[0]?.msg || 'Failed to post comment.';
      setSubmitError(msg);
      console.error('Failed to add comment:', err?.response?.data || err.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/posts/comments/${commentId}`);
      setComments((prev) => removeFromTree(prev, commentId));
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const { data } = await api.post(`/posts/comments/${commentId}/like`);
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) return { ...c, isLiked: data.isLiked, likesCount: data.likesCount };
          if (c.replies?.length) {
            return {
              ...c,
              replies: c.replies.map((r) =>
                r.id === commentId ? { ...r, isLiked: data.isLiked, likesCount: data.likesCount } : r
              ),
            };
          }
          return c;
        })
      );
    } catch (err) {
      console.error('Failed to like comment:', err);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>✕</button>

        <div className={styles.modalContent}>
          {/* Left: post image */}
          <div className={styles.postImageSide}>
            <SafeImage src={post.mediaUrl} alt="Post" className={styles.mainImage} />
          </div>

          {/* Right: comments */}
          <div className={styles.commentsSide}>
            <div className={styles.postHeader}>
              <SafeImage src={post.author?.avatarUrl} alt={post.author?.username} className={styles.avatar} />
              <div className={styles.headerInfo}>
                <div className={styles.username}>@{post.author?.username}</div>
                <div className={styles.caption}>{post.caption}</div>
                <div className={styles.timestamp}>{timeAgo(post.createdAt)}</div>
              </div>
            </div>

            <div className={styles.commentsList}>
              {loading ? (
                <div className={styles.loading}>Loading comments...</div>
              ) : comments.length === 0 ? (
                <div className={styles.noComments}>No comments yet. Be the first!</div>
              ) : (
                comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    currentUser={currentUser}
                    onReply={(c) => setReplyingTo(c)}
                    onDelete={() => handleDeleteComment(comment.id)}
                    onLike={() => handleLikeComment(comment.id)}
                  />
                ))
              )}
            </div>

            {replyingTo && (
              <div className={styles.replyingTo}>
                <span>Replying to @{replyingTo.user?.username}</span>
                <button onClick={() => setReplyingTo(null)}>✕</button>
              </div>
            )}

            {submitError && <div className={styles.submitError}>{submitError}</div>}

            <div className={styles.inputWrapper}>
              <CommentInput
                onSubmit={handleAddComment}
                placeholder={replyingTo ? `Reply to @${replyingTo.user?.username}...` : 'Add a comment...'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
