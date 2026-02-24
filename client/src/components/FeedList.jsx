import PostCard from './PostCard';

export default function FeedList({ posts, onMutate, currentUser }) {
  if (!posts.length) return <p className="card">No posts yet. Create the first one.</p>;

  return (
    <div className="feed-list">
      {posts.map((post) => (
        <PostCard key={post._id} post={post} onMutate={onMutate} currentUser={currentUser} />
      ))}
    </div>
  );
}
