import './RightSidebar.css';
import { SafeImage } from '../utils/media';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import FollowButton from './FollowButton';

export default function RightSidebar({ user }) {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const response = await api.get('/search?limit=5');
        setSuggestions(response.data.users || []);
      } catch (error) {
        console.error('Failed to load suggestions:', error);
      }
    };

    loadSuggestions();
  }, []);

  return (
    <aside className="right-sidebar">
      <div className="current-user-card">
        <div className="user-info">
          <div className="avatar-container">
            <SafeImage src={user?.avatarUrl} className="user-avatar" />
          </div>
          <div className="user-details">
            <span className="username">{user?.username}</span>
            <span className="full-name">{user?.fullName || user?.username}</span>
          </div>
        </div>
        <button className="switch-btn">Switch</button>
      </div>

      <div className="suggestions-section">
        <div className="suggestions-header">
          <span className="title">Suggested for you</span>
          <button className="see-all-btn">See All</button>
        </div>

        <div className="suggestions-list">
          {suggestions.map((suggested) => (
            <div key={suggested.id} className="suggestion-item">
              <Link to={`/profile/${suggested.id}`} className="suggested-user-info">
                <div className="avatar-container small">
                  <SafeImage src={suggested.avatar || '/default-avatar.png'} alt={suggested.username} className="user-avatar" />
                </div>
                <div className="suggested-details">
                  <span className="suggested-username">{suggested.username}</span>
                  <span className="followed-by">{suggested.name || suggested.username}</span>
                </div>
              </Link>
              <FollowButton
                userId={suggested.id}
                initialIsFollowing={suggested.isFollowing}
                variant="chip"
                onFollowChange={(isFollowing) => {
                  setSuggestions((prev) => prev.map((entry) => (
                    entry.id === suggested.id ? { ...entry, isFollowing } : entry
                  )));
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <footer className="sidebar-footer-links">
        <nav className="footer-nav">
          <a href="#">About</a> · <a href="#">Help</a> · <a href="#">Press</a> · <a href="#">API</a> · 
          <a href="#">Jobs</a> · <a href="#">Privacy</a> · <a href="#">Terms</a> · 
          <a href="#">Locations</a> · <a href="#">Language</a> · <a href="#">Meta Verified</a>
        </nav>
        <div className="copyright">
          © 2026 INSTAGRAM FROM META
        </div>
      </footer>
    </aside>
  );
}
