import styles from './HashtagResultCard.module.css';

export default function HashtagResultCard({ hashtag, onSelect }) {
  return (
    <button
      type="button"
      className={styles.card}
      onClick={() => onSelect?.({
        id: `hashtag:${hashtag.name}`,
        type: 'hashtag',
        label: `#${hashtag.name}`,
        secondaryText: `${hashtag.postsCount} posts`
      })}
    >
      <span className={styles.icon}>#</span>
      <span className={styles.meta}>
        <span className={styles.name}>#{hashtag.name}</span>
        <span className={styles.count}>{hashtag.postsCount} posts</span>
      </span>
    </button>
  );
}
