import './RightSidebar.css';
import { SafeImage } from '../utils/media';

export default function RightSidebar({ user }) {
  const suggestions = [
    { id: 1, username: 'ronald', fullName: 'Ronald McDonald', followedBy: 'd4nn3yfevl0n3' },
    { id: 2, username: 'laldydaldy', fullName: 'Laldy Daldy', followedBy: 'nahhumane' },
    { id: 3, username: 'nahhumane', fullName: 'Human Nah', followedBy: 'ronald' },
    { id: 4, username: 'cristiano', fullName: 'Cristiano Ronaldo', followedBy: 'laldydaldy' },
    { id: 5, username: 'leomessi', fullName: 'Lionel Messi', followedBy: 'nahhumane' },
  ];

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
              <div className="suggested-user-info">
                <div className="avatar-container small">
                  <div className="placeholder-avatar">👤</div>
                </div>
                <div className="suggested-details">
                  <span className="suggested-username">{suggested.username}</span>
                  <span className="followed-by">Followed by {suggested.followedBy}</span>
                </div>
              </div>
              <button className="follow-link">Follow</button>
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
