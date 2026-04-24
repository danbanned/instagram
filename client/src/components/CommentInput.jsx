import { useState } from 'react';
import styles from './CommentInput.module.css';

export default function CommentInput({ onSubmit, placeholder }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || loading) return;

    setLoading(true);
    try {
      await onSubmit(text);
      setText('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.commentForm} onSubmit={handleSubmit}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder || "Add a comment..."}
        className={styles.commentInput}
        disabled={loading}
      />
      <button 
        type="submit" 
        disabled={!text.trim() || loading}
        className={styles.postButton}
      >
        {loading ? '...' : 'Post'}
      </button>
    </form>
  );
}
