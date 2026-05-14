import styles from './SearchFilters.module.css';

export default function SearchFilters({ title = 'Categories', options = [], activeValue = '', onSelect, mobile = false }) {
  return (
    <section className={`${styles.section} ${mobile ? styles.mobile : ''}`}>
      <div className={styles.header}>
        <h3>{title}</h3>
      </div>

      <div className={styles.chips}>
        {options.map((option) => {
          const isActive = option === activeValue;

          return (
            <button
              key={option}
              type="button"
              className={`${styles.chip} ${isActive ? styles.active : ''}`}
              onClick={() => onSelect(option)}
            >
              {option}
            </button>
          );
        })}
      </div>
    </section>
  );
}
