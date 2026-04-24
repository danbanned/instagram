import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { SafeImage } from '../utils/media';
import styles from './ShareSheet.module.css';

const PLATFORMS = [
  { id: 'facebook',  icon: '📘', label: 'Facebook' },
  { id: 'messenger', icon: '💬', label: 'Messenger' },
  { id: 'whatsapp',  icon: '📱', label: 'WhatsApp' },
  { id: 'email',     icon: '📧', label: 'Email' },
  { id: 'threads',   icon: '🧵', label: 'Threads' },
];

export default function ShareSheet({ post, onClose, onAddToStory }) {
  const [query, setQuery]     = useState('');
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);
  const sheetRef = useRef(null);

  // Body scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Escape to close
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Fetch users — following list by default, search results when query is set
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const endpoint = query.trim()
      ? `/users/search?q=${encodeURIComponent(query.trim())}`
      : `/users/following`;

    api.get(endpoint)
      .then(res => { if (!cancelled) setUsers(res.data.users || []); })
      .catch(() => { if (!cancelled) setUsers([]); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [query]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlatform = (platform) => {
    const url  = encodeURIComponent(`${window.location.origin}/post/${post.id}`);
    const text = encodeURIComponent((post.caption || 'Check out this post!').slice(0, 100));
    const map  = {
      facebook:  `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      messenger: `fb-messenger://share/?link=${url}`,
      whatsapp:  `https://wa.me/?text=${text}%20${url}`,
      email:     `mailto:?subject=Check%20out%20this%20post&body=${text}%0A%0A${url}`,
      threads:   `https://www.threads.net/intent/post?text=${text}%20${url}`,
    };
    window.open(map[platform], '_blank', 'width=600,height=400');
  };

  const handleSendToUser = async (user) => {
    try { await api.post(`/posts/${post.id}/share`, { targetUserId: user.id }); } catch {}
    onClose();
  };

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} ref={sheetRef} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Share</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Post preview */}
        <div className={styles.preview}>
          <SafeImage className={styles.previewAvatar} src={post.author.avatarUrl} alt={post.author.username} />
          <div className={styles.previewText}>
            <span className={styles.previewUser}>{post.author.username}</span>
            {post.caption && (
              <span className={styles.previewCaption}>
                "{post.caption.length > 60 ? post.caption.slice(0, 60) + '…' : post.caption}"
              </span>
            )}
          </div>
        </div>

        {/* Search */}
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoComplete="off"
          />
        </div>

        {/* User list */}
        <div className={styles.userList}>
          {loading ? (
            <p className={styles.placeholder}>Loading…</p>
          ) : users.length === 0 ? (
            <p className={styles.placeholder}>{query ? 'No users found' : 'Follow people to share with them'}</p>
          ) : (
            users.map(u => (
              <button key={u.id} className={styles.userRow} onClick={() => handleSendToUser(u)}>
                <SafeImage className={styles.userAvatar} src={u.avatarUrl} alt={u.username} />
                <span className={styles.userUsername}>{u.username}</span>
              </button>
            ))
          )}
        </div>

        <div className={styles.divider} />

        {/* Copy link */}
        <button className={styles.actionRow} onClick={handleCopyLink}>
          <span className={styles.actionIcon}>📋</span>
          <span className={styles.actionLabel}>{copied ? 'Copied!' : 'Copy link'}</span>
        </button>

        {/* Add to story */}
        <button className={styles.actionRow} onClick={() => { onClose(); onAddToStory?.(); }}>
          <span className={styles.actionIcon}>📖</span>
          <span className={styles.actionLabel}>Add to story</span>
        </button>

        <div className={styles.divider} />

        {/* Platform grid */}
        <div className={styles.platformGrid}>
          {PLATFORMS.map(p => (
            <button key={p.id} className={styles.platformBtn} onClick={() => handlePlatform(p.id)}>
              <span className={styles.platformIcon}>{p.icon}</span>
              <span className={styles.platformLabel}>{p.label}</span>
            </button>
          ))}
        </div>

      </div>
    </div>,
    document.body
  );
}
