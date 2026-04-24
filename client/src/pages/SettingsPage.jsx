import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import styles from './SettingsPage.module.css';

const SECTIONS = [
  {
    title: 'Account',
    items: ['Edit profile', 'Change password', 'Account privacy', 'Close friends', 'Blocked', 'Notifications'],
  },
  {
    title: 'Content & display',
    items: ['Posts', 'Stories & live', 'Reels', 'Explore', 'Suggested content', 'Dark mode'],
  },
  {
    title: 'For families',
    items: ['Supervision', 'Parental controls'],
  },
  {
    title: 'More info & support',
    items: ['Help', 'About', 'Privacy policy', 'Terms of use'],
  },
];

export default function SettingsPage() {
  const navigate  = useNavigate();
  const { logout } = useAuth();
  const [active, setActive] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>‹</button>
          <h1 className={styles.title}>Settings</h1>
        </div>

        {SECTIONS.map(sec => (
          <div key={sec.title} className={styles.section}>
            <p className={styles.sectionTitle}>{sec.title}</p>
            {sec.items.map(item => (
              <button
                key={item}
                className={`${styles.item} ${active === item ? styles.itemActive : ''}`}
                onClick={() => setActive(item)}
              >
                {item}
                <span className={styles.chevron}>›</span>
              </button>
            ))}
          </div>
        ))}

        <div className={styles.section}>
          <button className={`${styles.item} ${styles.danger}`} onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>
    </main>
  );
}
