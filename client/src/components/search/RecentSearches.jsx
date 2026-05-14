import { SafeImage } from '../../utils/media';
import styles from './RecentSearches.module.css';

export default function RecentSearches({ items = [], onClear, onRemove, onSelect, compact = false }) {
  if (!items.length) return null;

  return (
    <section className={`${styles.section} ${compact ? styles.compact : ''}`}>
      <div className={styles.header}>
        <h3>Recent</h3>
        <button type="button" className={styles.clearAll} onClick={onClear}>
          Clear all
        </button>
      </div>

      <div className={styles.list}>
        {items.map((item) => (
          <div key={item.id} className={styles.item}>
            <button type="button" className={styles.selectButton} onClick={() => onSelect(item)}>
              {item.avatar ? (
                <SafeImage src={item.avatar} alt={item.label} className={styles.avatar} />
              ) : (
                <span className={styles.iconBubble}>{item.type === 'hashtag' ? '#' : '🔍'}</span>
              )}

              <span className={styles.meta}>
                <span className={styles.label}>{item.label}</span>
                <span className={styles.secondary}>{item.secondaryText}</span>
              </span>
            </button>

            <button
              type="button"
              className={styles.removeButton}
              onClick={() => onRemove(item.id)}
              aria-label={`Remove ${item.label}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
