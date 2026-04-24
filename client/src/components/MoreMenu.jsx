import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import styles from './MoreMenu.module.css';

export default function MoreMenu({ isOpen, onClose }) {
  const menuRef  = useRef(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLogout = () => {
    onClose();
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.menu} ref={menuRef} role="menu">
      <Link to="/settings"  className={styles.item} onClick={onClose}>
        <span className={styles.icon}>⚙️</span> Settings
      </Link>
      <Link to="/dashboard" className={styles.item} onClick={onClose}>
        <span className={styles.icon}>📊</span> Dashboard
      </Link>
      <div className={styles.divider} />
      <button className={styles.item}>
        <span className={styles.icon}>🌙</span> Switch appearance
      </button>
      <div className={styles.divider} />
      <button className={`${styles.item} ${styles.danger}`} onClick={handleLogout}>
        <span className={styles.icon}>🚪</span> Log out
      </button>
    </div>
  );
}
