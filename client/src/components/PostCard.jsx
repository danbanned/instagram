import { useState } from 'react';
import { addComment, toggleFollow, toggleLike } from '../services/postService';

export default function PostCard({ post, onMutate, currentUser }) {
  const [comment, setComment] = useState('');
  const currentUserId = currentUser?.id || currentUser?._id;
  const liked = post.likes?.some((id) => String(id) === String(currentUserId));

  const onLike = async () => {
    await toggleLike(post._id);
    onMutate();
  };

  const onComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    await addComment(post._id, comment.trim());
    setComment('');
    onMutate();
  };

  const onFollow = async () => {
    await toggleFollow(post.author._id);
    onMutate();
  };

  return (
    <article className="card post-card">
      <div className="row">
        <h3>@{post.author.username}</h3>
        {String(post.author._id) !== String(currentUserId) && <button onClick={onFollow}>Follow</button>}
      </div>

      <p>{post.caption}</p>

      {post.mediaType === 'video' ? (
        <video controls src={`${import.meta.env.VITE_SOCKET_URL}${post.mediaUrl}`} />
      ) : (
        <img src={`${import.meta.env.VITE_SOCKET_URL}${post.mediaUrl}`} alt="post" />
      )}

      <div className="row">
        <button onClick={onLike}>{liked ? 'Unlike' : 'Like'}</button>
        <span>{post.likes.length} likes</span>
      </div>

      <ul className="comments">
        {post.comments.map((c) => (
          <li key={c._id}>
            <strong>@{c.user?.username || 'user'}:</strong> {c.text}
          </li>
        ))}
      </ul>

      <form onSubmit={onComment} className="row">
        <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment" />
        <button type="submit">Send</button>
      </form>
    </article>
  );
}
