import PostCard from './PostCard';

export default function FeedList({ posts, currentUser, onLike, onComment, onSave, onFollow }) {
  if (!posts?.length) {
    return (
      <p className="card" style={{ textAlign: 'center', color: '#8e8e8e' }}>
        No posts yet. Follow some users or create your first post!
      </p>
    );
  }

  return (
    <div className="feed-list">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUser={currentUser}
          onLike={onLike}
          onComment={onComment}
          onSave={onSave}
          onFollow={onFollow}
        />
      ))}
    </div>
  );
}
