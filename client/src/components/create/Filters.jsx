import styles from './Filters.module.css';

const FILTERS = [
  { id: 'normal',    name: 'Normal',    css: '' },
  { id: 'clarendon', name: 'Clarendon', css: 'brightness(1.05) contrast(1.1) saturate(1.2)' },
  { id: 'gingham',   name: 'Gingham',   css: 'brightness(1.02) contrast(0.9) saturate(0.85)' },
  { id: 'moon',      name: 'Moon',      css: 'grayscale(1) brightness(1.1) contrast(1.1)' },
  { id: 'lark',      name: 'Lark',      css: 'brightness(1.1) contrast(0.95) saturate(0.9)' },
  { id: 'reyes',     name: 'Reyes',     css: 'sepia(0.22) brightness(1.1) contrast(0.85) saturate(0.75)' },
  { id: 'juno',      name: 'Juno',      css: 'brightness(1.05) contrast(1.1) saturate(1.4)' },
  { id: 'slumber',   name: 'Slumber',   css: 'saturate(0.66) brightness(1.05) contrast(0.9)' },
  { id: 'crema',     name: 'Crema',     css: 'sepia(0.15) contrast(0.9) brightness(1.05) saturate(0.75)' },
  { id: 'aden',      name: 'Aden',      css: 'hue-rotate(-20deg) contrast(0.9) saturate(0.85) brightness(1.2)' },
  { id: 'perpetua',  name: 'Perpetua',  css: 'contrast(1.1) brightness(1.05) saturate(1.1)' },
  { id: 'valencia',  name: 'Valencia',  css: 'brightness(1.05) contrast(1.02) saturate(1.08) sepia(0.08)' },
];

export default function Filters({ previewUrl, selectedFilter, onFilterChange }) {
  return (
    <div className={styles.container}>
      {/* Live preview */}
      <div className={styles.livePreview}>
        <img
          src={previewUrl}
          alt="Preview"
          className={styles.liveImg}
          style={{ filter: selectedFilter }}
        />
      </div>

      {/* Filter thumbnails */}
      <div className={styles.strip}>
        {FILTERS.map(f => (
          <button
            key={f.id}
            type="button"
            className={`${styles.filterBtn} ${selectedFilter === f.css ? styles.active : ''}`}
            onClick={() => onFilterChange(f.css)}
          >
            <div className={styles.thumb}>
              <img
                src={previewUrl}
                alt={f.name}
                className={styles.thumbImg}
                style={{ filter: f.css }}
              />
            </div>
            <span className={styles.filterName}>{f.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
