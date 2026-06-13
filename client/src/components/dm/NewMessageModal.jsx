import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import styles from './NewMessageModal.module.css';

export default function NewMessageModal({ onClose, onStartChat }) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      // Show suggestions from recent conversations when no search
      const loadSuggested = async () => {
        try {
          const res = await api.get('/messages/conversations');
          const convUsers = (res.data.conversations || [])
            .filter(c => !c.isGroup && c.otherUser)
            .map(c => c.otherUser)
            .slice(0, 10);
          setUsers(convUsers);
        } catch {
          setUsers([]);
        }
      };
      loadSuggested();
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query.trim())}&type=top&limit=12`);
        setUsers(res.data.users || []);
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleStartChat = async () => {
    if (!selected) return;
    setStarting(true);
    try {
      const res = await api.post('/messages/conversations', { otherUserId: selected.id });
      onStartChat(res.data.conversationId);
    } catch (e) {
      console.error('Failed to start chat:', e);
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.title}>New message</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* To field */}
        <div className={styles.toRow}>
          <span className={styles.toLabel}>To:</span>
          <input
            ref={inputRef}
            className={styles.toInput}
            placeholder="Search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {loading && <span className={styles.loadingDot}>···</span>}
        </div>

        <div className={styles.divider} />

        {/* Suggested / search results */}
        {!query.trim() && <p className={styles.sectionLabel}>Suggested</p>}

        <div className={styles.contactList}>
          {users.length === 0 && !loading && (
            <p className={styles.empty}>No users found</p>
          )}
          {users.map(u => (
            <button
              key={u.id}
              className={`${styles.contactItem} ${selected?.id === u.id ? styles.contactSelected : ''}`}
              onClick={() => setSelected(prev => prev?.id === u.id ? null : u)}
            >
              <img
                src={u.avatarUrl || u.avatar || '/default-avatar.png'}
                className={styles.contactAvatar}
                alt={u.username}
                onError={e => { e.target.src = '/default-avatar.png'; }}
              />
              <div className={styles.contactInfo}>
                <span className={styles.contactName}>{u.name || u.username}</span>
                <span className={styles.contactUsername}>{u.username}</span>
              </div>
              <div className={`${styles.checkbox} ${selected?.id === u.id ? styles.checkboxSelected : ''}`}>
                {selected?.id === u.id && <span className={styles.checkmark}>✓</span>}
              </div>
            </button>
          ))}
        </div>

        {/* Chat button */}
        <div className={styles.footer}>
          <button
            className={`${styles.chatBtn} ${!selected ? styles.chatBtnDisabled : ''}`}
            onClick={handleStartChat}
            disabled={!selected || starting}
          >
            {starting ? 'Starting...' : 'Chat'}
          </button>
        </div>
      </div>
    </div>
  );
}
