import { useState } from 'react';
import { SafeImage } from '../utils/media';
import { timeAgo } from '../utils/timeAgo';
import styles from './CommentItem.module.css';

export default function CommentItem({ comment, currentUser, onReply, onDelete, onLike }) {
  const [showReplies, setShowReplies] = useState(false);
  const isAuthor = currentUser?.id === comment.user?.id;

  return (
    <div className={styles.commentItem}>
      <SafeImage src={comment.user?.avatarUrl} alt="" className={styles.avatar} />
      <div className={styles.commentContent}>
        <div className={styles.commentHeader}>
          <span className={styles.username}>{comment.user?.username}</span>
          <span className={styles.commentText}>{comment.text}</span>
        </div>
        <div className={styles.commentActions}>
          <span className={styles.timestamp}>{timeAgo(comment.createdAt)}</span>
          {comment.likesCount > 0 && (
            <span className={styles.likesCount}>{comment.likesCount} {comment.likesCount === 1 ? 'like' : 'likes'}</span>
          )}
          <button onClick={() => onReply(comment)} className={styles.actionButton}>
            Reply
          </button>
          {isAuthor && (
            <button onClick={onDelete} className={styles.actionButton}>Delete</button>
          )}
          <button onClick={onLike} className={styles.likeButton}>
            {comment.isLiked ? '❤️' : '🤍'}
          </button>
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className={styles.repliesSection}>
            <button
              className={styles.viewReplies}
              onClick={() => setShowReplies(!showReplies)}
            >
              <span className={styles.line}></span>
              {showReplies ? 'Hide' : `View replies (${comment.replies.length})`}
            </button>
            {showReplies && (
              <div className={styles.repliesList}>
                {comment.replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    currentUser={currentUser}
                    onReply={onReply}
                    onDelete={onDelete}
                    onLike={onLike}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
