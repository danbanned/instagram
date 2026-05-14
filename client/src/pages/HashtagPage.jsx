import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import { SafeImage } from '../utils/media';
import styles from './HashtagPage.module.css';

export default function HashtagPage() {
  const { tag } = useParams();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [hashtag, setHashtag] = useState(null);

  useEffect(() => {
    const loadHashtag = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/hashtags/${encodeURIComponent(tag)}/posts`);
        setPosts(response.data.posts || []);
        setHashtag(response.data.hashtag || { name: tag, postCount: 0 });
      } catch (error) {
        console.error('Failed to load hashtag:', error);
        setPosts([]);
        setHashtag({ name: tag, postCount: 0 });
      } finally {
        setLoading(false);
      }
    };

    loadHashtag();
  }, [tag]);

  if (loading) return <div className={styles.state}>Loading hashtag…</div>;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>#{tag}</h1>
        <p>{hashtag?.postCount || 0} posts</p>
      </header>

      {!posts.length ? (
        <div className={styles.state}>
          <p>No posts found for #{tag}.</p>
          <Link to="/search">Search for something else</Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {posts.map((post) => (
            <Link key={post.id} to={`/profile/${post.author.id}`} className={styles.card}>
              <SafeImage src={post.mediaUrl} alt={post.caption || `#${tag}`} className={styles.image} />
              <div className={styles.overlay}>
                <span>♥ {post.likesCount}</span>
                <span>💬 {post.commentsCount}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
