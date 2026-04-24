import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import styles from './CreateDropdown.module.css';

const ITEMS = [
  { id: 'post',     icon: '📷', label: 'Post',       desc: 'Share a photo or video' },
  { id: 'story',    icon: '📖', label: 'Story',      desc: 'Disappears after 24 hours' },
  { id: 'reel',     icon: '✨', label: 'Reel',       desc: 'Create a short, entertaining video' },
  { id: 'ai-image', icon: '🎨', label: 'AI Image',   desc: 'Generate an image with AI' },
  { id: 'ai-text',  icon: '🤖', label: 'AI Text',    desc: 'Generate a caption or post' },
  { id: 'live',     icon: '🎥', label: 'Live Video', desc: 'Go live with your followers' },
];

export default function CreateDropdown({ anchorEl, onClose, onSelect }) {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Outside click + Escape
  useEffect(() => {
    const onDown = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        e.target !== anchorEl
      ) onClose();
    };
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [anchorEl, onClose]);

  // Compute fixed position from button rect
  const rect = anchorEl?.getBoundingClientRect?.();
  if (!rect) return null;

  const top  = Math.min(rect.top, window.innerHeight - 390);
  const left = rect.right + 12;

  const handleSelect = (id) => {
    onSelect(id);
    onClose();
  };

  return createPortal(
    <div
      ref={dropdownRef}
      className={styles.dropdown}
      style={{ top, left }}
    >
      {ITEMS.map((item, i) => (
        <div key={item.id}>
          <button className={styles.item} onClick={() => handleSelect(item.id)}>
            <span className={styles.icon}>{item.icon}</span>
            <div className={styles.text}>
              <span className={styles.label}>{item.label}</span>
              <span className={styles.desc}>{item.desc}</span>
            </div>
          </button>
          {i < ITEMS.length - 1 && <div className={styles.divider} />}
        </div>
      ))}
    </div>,
    document.body
  );
}
