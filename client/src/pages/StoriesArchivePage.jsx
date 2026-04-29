import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchArchivedStories } from '../services/highlightService';
import { SafeImage } from '../utils/media';
import styles from './StoriesArchivePage.module.css';

export default function StoriesArchivePage() {
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArchive = async () => {
      try {
        const data = await fetchArchivedStories();
        if (data.success) {
          setStories(data.stories);
        }
      } catch (err) {
        console.error('Failed to load archive:', err);
      } finally {
        setLoading(false);
      }
    };
    loadArchive();
  }, []);

  // Group stories by date
  const groupedStories = stories.reduce((groups, story) => {
    const date = new Date(story.createdAt).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(story);
    return groups;
  }, {});

  if (loading) return <div className={styles.loading}>Loading archive...</div>;

  return (
    <div className={styles.archivePage}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>←</button>
        <h1>Stories Archive</h1>
      </header>

      <div className={styles.content}>
        {Object.entries(groupedStories).map(([date, stories]) => (
          <section key={date} className={styles.dateSection}>
            <h2 className={styles.dateHeader}>{date}</h2>
            <div className={styles.grid}>
              {stories.map(story => (
                <div key={story.id} className={styles.storyCard}>
                  {story.mediaType === 'video' ? (
                    <video src={story.mediaUrl} className={styles.media} />
                  ) : (
                    <SafeImage src={story.mediaUrl} className={styles.media} />
                  )}
                  {story.isPinned && <span className={styles.pinnedBadge}>📌</span>}
                </div>
              ))}
            </div>
          </section>
        ))}
        {stories.length === 0 && (
          <div className={styles.empty}>
            <p>You haven't archived any stories yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
