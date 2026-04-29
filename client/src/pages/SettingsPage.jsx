import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import styles from './SettingsPage.module.css';

const SECTIONS = [
  {
    title: 'How you use Instagram',
    items: [
      { id: 'account', label: 'Account', icon: '👤' },
      { id: 'privacy', label: 'Privacy', icon: '🔒' },
      { id: 'security', label: 'Security', icon: '🛡️' },
      { id: 'notifications', label: 'Notifications', icon: '🔔' },
    ],
  },
  {
    title: 'Content & display',
    items: [
      { id: 'dark-mode', label: 'Dark mode', icon: '🌙' },
      { id: 'language', label: 'Language', icon: '🌐' },
    ],
  },
  {
    title: 'More info & support',
    items: [
      { id: 'help', label: 'Help', icon: '❓' },
      { id: 'about', label: 'About', icon: 'ℹ️' },
    ],
  },
];

export default function SettingsPage() {
  const navigate  = useNavigate();
  const { logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [active, setActive] = useState('account');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.sidebar}>
          <div className={styles.header}>
            <button className={styles.backBtn} onClick={() => navigate(-1)}>‹</button>
            <h1 className={styles.title}>Settings</h1>
          </div>

          <div className={styles.menuList}>
            {SECTIONS.map(sec => (
              <div key={sec.title} className={styles.menuSection}>
                <p className={styles.sectionTitle}>{sec.title}</p>
                {sec.items.map(item => (
                  <button
                    key={item.id}
                    className={`${styles.menuItem} ${active === item.id ? styles.itemActive : ''}`}
                    onClick={() => setActive(item.id)}
                  >
                    <span className={styles.itemIcon}>{item.icon}</span>
                    <span className={styles.itemLabel}>{item.label}</span>
                  </button>
                ))}
              </div>
            ))}
            <button className={`${styles.menuItem} ${styles.danger}`} onClick={handleLogout}>
              <span className={styles.itemIcon}>🚪</span>
              <span className={styles.itemLabel}>Log out</span>
            </button>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.contentHeader}>
            <h2>{active.charAt(0).toUpperCase() + active.slice(1)} Settings</h2>
          </div>
          <div className={styles.contentBody}>
             {active === 'account' && (
               <div className={styles.settingsGroup}>
                 <h3>Personal Information</h3>
                 <p>Manage your account details and how others see you.</p>
                 {/* Account settings fields */}
               </div>
             )}
             {active === 'privacy' && (
               <div className={styles.settingsGroup}>
                 <h3>Privacy Settings</h3>
                 <p>Control who can see your content and interact with you.</p>
               </div>
             )}
             {active === 'security' && (
               <div className={styles.settingsGroup}>
                 <h3>Security Settings</h3>
                 <p>Protect your account with password and 2FA.</p>
               </div>
             )}
             {active === 'notifications' && (
               <div className={styles.settingsGroup}>
                 <h3>Notification Settings</h3>
                 <p>Choose which notifications you want to receive.</p>
               </div>
             )}
             {active === 'dark-mode' && (
               <div className={styles.settingsGroup}>
                 <h3>Dark Mode</h3>
                 <p>Switch between light and dark appearance.</p>
                 <div style={{ display: 'flex', alignItems: 'center', marginTop: '20px' }}>
                    <input 
                      type="checkbox" 
                      checked={darkMode}
                      onChange={toggleDarkMode}
                      style={{ width: 'auto', marginRight: '10px' }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>
                      {darkMode ? 'Dark Mode On' : 'Dark Mode Off'}
                    </span>
                 </div>
               </div>
             )}
          </div>
        </div>
      </div>
    </main>
  );
}
