import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { timeAgo } from '../utils/timeAgo';
import { SafeImage, getMediaUrl } from '../utils/media';
import PostOptionsMenu from './PostOptionsMenu';
import CommentsModal from './CommentsModal';
import ShareSheet from './ShareSheet';
import StoryCreator from './StoryCreator';
import '../styles/PostCard.css';

function extractHashtags(caption) {
  if (!caption) return [];
  return (caption.match(/#\w+/g) || []).map((t) => t.slice(1));
}

function stripHashtags(caption) {
  if (!caption) return '';
  return caption.replace(/#\w+/g, '').trim();
}

export default function PostCard({ post, currentUser, onLike, onComment, onSave, onFollow }) {
  const [commentText, setCommentText] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showStoryCreator, setShowStoryCreator] = useState(false);
  const navigate = useNavigate();

  const isOwnPost = String(post.author.id) === String(currentUser?.id);
  const hashtags = extractHashtags(post.caption);
  const captionText = stripHashtags(post.caption);

  const handleLikeClick = () => onLike && onLike(post.id, post.likedByMe);
  const handleSaveClick = () => onSave && onSave(post.id, post.savedByMe);
  const handleFollowClick = () => onFollow && onFollow(post.author.id);

  const handleMenuClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Position relative to the article which is position: relative
    const parentRect = e.currentTarget.closest('.ig-post').getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom - parentRect.top,
      right: parentRect.right - rect.right,
    });
    setShowMenu(true);
  };

  const handleMenuAction = (action, post) => {
    switch (action) {
      case 'report':
        alert('Report post');
        break;
      case 'unfollow':
        if (onFollow) onFollow(post.author.id);
        alert(`Unfollowed ${post.author?.username}`);
        break;
      case 'favorite':
        alert('Added to favorites');
        break;
      case 'goToPost':
        navigate(`/post/${post.id}`);
        break;
      case 'share':
        setShowShareSheet(true);
        break;
      case 'copyLink':
        navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
        alert('Link copied!');
        break;
      case 'embed':
        alert(`<iframe src="/post/${post.id}" ...>`);
        break;
      case 'about':
        navigate(`/profile/${post.author?.id}`);
        break;
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text || !onComment) return;
    setCommentText('');
    await onComment(post.id, text);
  };

  return (
    <article className={`ig-post ${showMenu ? 'menu-open' : ''}`}>
      {/* Header */}
      <div className="ig-post__header">
        <Link to={`/profile/${post.author.id}`} className="ig-post__user">
          <SafeImage
            className="ig-post__avatar"
            src={post.author.avatarUrl}
            alt={post.author.username}
          />
          <div>
            <div className="ig-post__username">@{post.author.username}</div>
            {post.location && <div className="ig-post__location">{post.location}</div>}
          </div>
        </Link>

        <div className="ig-post__header-actions">
          {!isOwnPost && (
            <button className="ig-post__follow-btn" onClick={handleFollowClick}>
              Follow
            </button>
          )}
          <button 
            className="ig-post__menu-btn"
            onClick={handleMenuClick}
            aria-label="Post options"
          >
            ···
          </button>
        </div>

        {showMenu && (
          <div 
            className="post-options-wrapper"
            style={{ position: 'absolute', top: menuPosition.top, right: menuPosition.right }}
          >
            <PostOptionsMenu
              post={{...post, timeAgo: timeAgo(post.createdAt)}}
              isOpen={showMenu}
              onClose={() => setShowMenu(false)}
              onAction={handleMenuAction}
            />
          </div>
        )}
      </div>

      {/* Media */}
      <div className="ig-post__media">
        {post.mediaType === 'video' ? (
          <video controls src={getMediaUrl(post.mediaUrl)} />
        ) : (
          <SafeImage src={post.mediaUrl} alt={captionText || 'post'} />
        )}
        {post.isAIGenerated && (
          <div className="ig-post__ai-badge">🤖 AI Generated</div>
        )}
      </div>

      {/* Action buttons */}
      <div className="ig-post__actions">
        <div className="ig-post__action-btns">
          <button
            className={`ig-post__action-btn${post.likedByMe ? ' ig-post__action-btn--liked' : ''}`}
            onClick={handleLikeClick}
            aria-label={post.likedByMe ? 'Unlike' : 'Like'}
          >
            {post.likedByMe ? '❤️' : '🤍'}
          </button>

          <button
            className="ig-post__action-btn"
            onClick={() => setShowCommentsModal(true)}
            aria-label="Comment"
          >
            💬
          </button>

          <button className="ig-post__action-btn" aria-label="Share" onClick={() => setShowShareSheet(true)}>↪️</button>

          <button
            className="ig-post__action-btn ig-post__save-btn"
            onClick={handleSaveClick}
            aria-label={post.savedByMe ? 'Unsave' : 'Save'}
          >
            {post.savedByMe ? '🔖' : '📌'}
          </button>
        </div>

        <div className="ig-post__likes">
          {(post.likesCount || 0).toLocaleString()} {post.likesCount === 1 ? 'like' : 'likes'}
        </div>
      </div>

      {/* Caption */}
      {(captionText || hashtags.length > 0) && (
        <div className="ig-post__caption">
          <Link to={`/profile/${post.author.id}`} className="ig-post__caption-user">
            {post.author.username}
          </Link>
          {captionText && <span>{captionText}</span>}
          {hashtags.length > 0 && (
            <div className="ig-post__hashtags">
              {hashtags.map((tag) => (
                <Link key={tag} to={`/explore/tags/${tag}`} className="ig-post__hashtag">
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Comments */}
      {post.comments?.length > 0 && (
        <>
          {!showAllComments && post.comments.length > 2 && (
            <button
              className="ig-post__comments-toggle"
              onClick={() => setShowAllComments(true)}
            >
              View all {post.comments.length} comments
            </button>
          )}

          <div className="ig-post__comments-list">
            {(showAllComments ? post.comments : post.comments.slice(-2)).map((c) => (
              <div key={c.id} className="ig-post__comment">
                <Link to={`/profile/${c.user.id}`}>{c.user.username}</Link>
                <span>{c.text}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Timestamp */}
      <div className="ig-post__time">{timeAgo(post.createdAt)}</div>

      {/* Comment input */}
      <form className="ig-post__comment-form" onSubmit={handleCommentSubmit}>
        <input
          className="ig-post__comment-input"
          placeholder="Add a comment…"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
        />
        <button
          type="submit"
          className="ig-post__comment-submit"
          disabled={!commentText.trim()}
        >
          Post
        </button>
      </form>
      <CommentsModal
        post={post}
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        currentUser={currentUser}
      />

      {showShareSheet && (
        <ShareSheet
          post={post}
          onClose={() => setShowShareSheet(false)}
          onAddToStory={() => setShowStoryCreator(true)}
        />
      )}

      {showStoryCreator && (
        <StoryCreator
          onClose={() => setShowStoryCreator(false)}
          onCreated={() => setShowStoryCreator(false)}
        />
      )}
    </article>
  );
}
