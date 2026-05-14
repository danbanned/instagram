import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { SafeImage } from '../../utils/media';
import HashtagResultCard from './HashtagResultCard';
import UserResultCard from './UserResultCard';
import styles from './SearchResults.module.css';

const TABS = [
  { id: 'top', label: 'Top' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'audio', label: 'Audio' },
  { id: 'tags', label: 'Tags' }
];

export default function SearchResults({
  results,
  loading,
  loadingMore,
  error,
  context,
  onTabChange,
  onSelectResult,
  onLoadMore
}) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!sentinelRef.current || !results.hasMore || loadingMore || context.activeTab !== 'top') return undefined;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        onLoadMore?.();
      }
    }, { rootMargin: '300px 0px' });

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [context.activeTab, loadingMore, onLoadMore, results.hasMore]);

  const topBlocks = useMemo(() => {
    if (context.activeTab !== 'top') return [];

    return [
      results.users.length ? { id: 'users', title: 'Accounts', content: 'users' } : null,
      results.hashtags.length ? { id: 'hashtags', title: 'Tags', content: 'hashtags' } : null,
      results.posts.length ? { id: 'posts', title: context.isDiscoverMode ? 'Suggested content' : 'Top results', content: 'posts' } : null
    ].filter(Boolean);
  }, [context.activeTab, context.isDiscoverMode, results.hashtags.length, results.posts.length, results.users.length]);

  const renderPosts = () => (
    <div className={styles.postGrid}>
      {results.posts.map((post) => (
        <Link key={post.id} to={`/profile/${post.user.id}`} className={styles.postCard}>
          <SafeImage src={post.mediaUrl} alt={post.caption || post.user.username} className={styles.postImage} />
          <div className={styles.postOverlay}>
            <span>♥ {post.likesCount}</span>
            <span>💬 {post.commentsCount}</span>
          </div>
        </Link>
      ))}
    </div>
  );

  const renderAudio = () => (
    <div className={styles.audioList}>
      {results.audio.map((item) => (
        <div key={item.id} className={styles.audioCard}>
          <SafeImage src={item.creator.avatar || '/default-avatar.png'} alt={item.creator.username} className={styles.audioAvatar} />
          <div className={styles.audioMeta}>
            <strong>{item.title}</strong>
            <span>{item.creator.username}</span>
          </div>
          <span className={styles.audioCount}>{item.useCount} uses</span>
        </div>
      ))}
    </div>
  );

  return (
    <section className={styles.results}>
      {!context.isMobile && (
        <div className={styles.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tab} ${context.activeTab === tab.id ? styles.activeTab : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {error && <div className={styles.notice}>{error}</div>}
      {loading && <div className={styles.notice}>Loading results...</div>}

      {!loading && !error && context.activeTab === 'top' && topBlocks.map((block) => (
        <div key={block.id} className={styles.block}>
          <div className={styles.blockHeader}>
            <h3>{block.title}</h3>
          </div>

          {block.content === 'users' && (
            <div className={styles.list}>
              {results.users.map((user) => (
                <UserResultCard key={user.id} user={user} onSelect={onSelectResult} />
              ))}
            </div>
          )}

          {block.content === 'hashtags' && (
            <div className={styles.list}>
              {results.hashtags.map((tag) => (
                <HashtagResultCard
                  key={tag.id}
                  hashtag={tag}
                  onSelect={(entry) => {
                    onSelectResult?.(entry);
                    onTabChange('tags');
                  }}
                />
              ))}
            </div>
          )}

          {block.content === 'posts' && renderPosts()}
        </div>
      ))}

      {!loading && !error && context.activeTab === 'accounts' && (
        <div className={styles.list}>
          {results.users.map((user) => (
            <UserResultCard key={user.id} user={user} onSelect={onSelectResult} />
          ))}
        </div>
      )}

      {!loading && !error && context.activeTab === 'tags' && (
        <div className={styles.list}>
          {results.hashtags.map((tag) => (
            <HashtagResultCard key={tag.id} hashtag={tag} onSelect={onSelectResult} />
          ))}
        </div>
      )}

      {!loading && !error && context.activeTab === 'audio' && renderAudio()}

      {!loading && !error &&
        context.activeTab !== 'top' &&
        !results.users.length &&
        !results.hashtags.length &&
        !results.audio.length &&
        !results.posts.length && (
          <div className={styles.notice}>
            No results found for {context.query ? `"${context.query}"` : 'this search'}.
          </div>
        )}

      {!loading && !error && context.activeTab === 'top' && !topBlocks.length && (
        <div className={styles.notice}>
          No results found for "{context.query}".
        </div>
      )}

      {context.activeTab === 'top' && results.hasMore && <div ref={sentinelRef} className={styles.sentinel} />}
      {loadingMore && <div className={styles.notice}>Loading more...</div>}
    </section>
  );
}
