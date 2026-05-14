import { useEffect, useRef, useState } from 'react';
import styles from './SearchBar.module.css';

export default function SearchBar({ value, onChange, placeholder = 'Search', autoFocus = false }) {
  const [inputValue, setInputValue] = useState(value || '');
  const inputRef = useRef(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  const handleClear = () => {
    setInputValue('');
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div className={styles.searchBar}>
      <span className={styles.icon}>🔍</span>
      <input
        ref={inputRef}
        type="search"
        value={inputValue}
        onChange={(event) => {
          const nextValue = event.target.value;
          setInputValue(nextValue);
          onChange(nextValue);
        }}
        placeholder={placeholder}
        className={styles.input}
      />
      {inputValue && (
        <button type="button" className={styles.clearButton} onClick={handleClear} aria-label="Clear search">
          ×
        </button>
      )}
    </div>
  );
}
