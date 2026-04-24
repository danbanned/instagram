import { useState } from 'react';
import styles from './ExplorePage.module.css';

const MOCK_POSTS = Array.from({ length: 33 }, (_, i) => ({
  id: i,
  src: `https://picsum.photos/seed/explore${i}/300/300`,
  likes: Math.floor(Math.random() * 15000) + 100,
  comments: Math.floor(Math.random() * 500),
  isVideo: i % 7 === 0,
  isCarousel: i % 5 === 0,
}));

export default function ExplorePage() {
  const [hovered, setHovered] = useState(null);

  return (
    <main className={styles.page}>
      <div className={styles.grid}>
        {MOCK_POSTS.map((post, idx) => {
          const isFeatured = idx % 10 === 0;
          return (
            <div
              key={post.id}
              className={`${styles.cell} ${isFeatured ? styles.featured : ''}`}
              onMouseEnter={() => setHovered(post.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <img src={post.src} alt="" className={styles.img} loading="lazy" />
              {post.isVideo    && <span className={styles.badge}>▶</span>}
              {post.isCarousel && <span className={styles.badge}>⧉</span>}
              {hovered === post.id && (
                <div className={styles.overlay}>
                  <span>❤️ {post.likes.toLocaleString()}</span>
                  <span>💬 {post.comments.toLocaleString()}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
