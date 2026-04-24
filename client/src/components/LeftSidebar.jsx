import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import CreateDropdown from './CreateDropdown';
import StoryCreator   from './StoryCreator';
import MoreMenu       from './MoreMenu';
import './LeftSidebar.css';

const NAV_ITEMS = [
  { path: '/',              label: 'Home',          icon: '🏠' },
  { path: '/search',        label: 'Search',        icon: '🔍' },
  { path: '/explore',       label: 'Explore',       icon: '🧭' },
  { path: '/reels',         label: 'Reels',         icon: '🎬' },
  { path: '/messages',      label: 'Messages',      icon: '💬' },
  { path: '/notifications', label: 'Notifications', icon: '🔔' },
];

export default function LeftSidebar({ user }) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const createRef = useRef(null);
  const moreRef   = useRef(null);

  const [dropdownOpen,    setDropdownOpen]    = useState(false);
  const [storyCreatorOpen, setStoryCreatorOpen] = useState(false);
  const [moreOpen,        setMoreOpen]        = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleCreateSelect = (type) => {
    setDropdownOpen(false);
    if (type === 'post') {
      navigate('/create');
    } else if (type === 'story') {
      setStoryCreatorOpen(true);
    } else {
      navigate(`/create?type=${type}`);
    }
  };

  return (
    <>
      <aside className="left-sidebar">
        <div className="sidebar-logo">
          <Link to="/">
            <span className="logo-text">Instagram</span>
          </Link>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}

          {/* Create button */}
          <button
            ref={createRef}
            className={`nav-item ${dropdownOpen ? 'active' : ''}`}
            onClick={() => setDropdownOpen(o => !o)}
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
          >
            <span className="nav-icon">➕</span>
            <span className="nav-label">Create</span>
          </button>

          {/* Profile link */}
          <Link
            to={`/profile/${user?.id}`}
            className={`nav-item ${isActive(`/profile/${user?.id}`) ? 'active' : ''}`}
          >
            <span className="nav-icon">👤</span>
            <span className="nav-label">Profile</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <Link to="/threads" className="nav-item">
            <span className="nav-icon">@</span>
            <span className="nav-label">Threads</span>
          </Link>
          <button
            ref={moreRef}
            className={`nav-item more-btn ${moreOpen ? 'active' : ''}`}
            onClick={() => setMoreOpen(o => !o)}
          >
            <span className="nav-icon">☰</span>
            <span className="nav-label">More</span>
          </button>
        </div>
      </aside>

      {dropdownOpen && (
        <CreateDropdown
          anchorEl={createRef.current}
          onClose={() => setDropdownOpen(false)}
          onSelect={handleCreateSelect}
        />
      )}

      {storyCreatorOpen && (
        <StoryCreator
          onClose={() => setStoryCreatorOpen(false)}
          onCreated={() => setStoryCreatorOpen(false)}
        />
      )}

      <MoreMenu isOpen={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
