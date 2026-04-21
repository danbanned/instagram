import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Navbar.css';

const navLinks = (userId) => [
  { to: '/',             label: 'Home',          icon: '🏠' },
  { to: '/search',       label: 'Search',        icon: '🔍' },
  { to: '/create',       label: 'Create',        icon: '➕' },
  { to: '/reels',        label: 'Reels',         icon: '🎬' },
  { to: '/messages',     label: 'Messages',      icon: '💬' },
  { to: '/notifications',label: 'Notifications', icon: '🔔' },
  { to: `/profile/${userId}`, label: 'Profile',       icon: '👤' },
];

export default function Navbar({ user, onLogout }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const links = navLinks(user?.id);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const isActive = (to) => location.pathname === to;

  return (
    <>
      {/* ── Desktop Navbar ── */}
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            <span>🎨</span>
            <span className="nav-logo-text">Instagram Clone</span>
          </Link>

          <div className="nav-search-container">
            <span className="nav-search-icon">🔍</span>
            <input type="text" placeholder="Search" className="nav-search-input" />
          </div>

          <div className="nav-links">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`nav-link${isActive(link.to) ? ' active' : ''}`}
              >
                <span className="nav-icon">{link.icon}</span>
                <span className="nav-label">{link.label}</span>
              </Link>
            ))}
          </div>

          <div className="nav-user">
            <span className="nav-username">@{user?.username}</span>
            <button className="nav-logout-btn" onClick={onLogout}>Logout</button>
          </div>
        </div>
      </nav>

      {/* ── Mobile Header ── */}
      <nav className={`mobile-header${scrolled ? ' scrolled' : ''}`}>
        <div className="mobile-header-container">
          <Link to="/" className="mobile-logo">🎨 Instagram Clone</Link>

          <div className="mobile-header-right">
            <span className="mobile-username">@{user?.username}</span>
            <button
              className="menu-button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="mobile-menu">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`mobile-nav-link${isActive(link.to) ? ' active' : ''}`}
              >
                <span className="mobile-nav-icon">{link.icon}</span>
                <span className="mobile-nav-label">{link.label}</span>
              </Link>
            ))}

            <div className="mobile-search">
              <input
                type="text"
                placeholder="Search..."
                className="mobile-search-input"
              />
            </div>

            <div className="mobile-logout">
              <button className="mobile-logout-btn" onClick={onLogout}>
                🚪 Logout (@{user?.username})
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── Bottom Navigation (Mobile only) ── */}
      <div className="bottom-nav">
        <div className="bottom-nav-container">
          {links.slice(0, 5).map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`bottom-nav-link${isActive(link.to) ? ' active' : ''}`}
            >
              <span className="bottom-nav-icon">{link.icon}</span>
              <span className="bottom-nav-label">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
