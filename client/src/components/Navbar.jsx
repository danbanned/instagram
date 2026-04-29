import { Link } from 'react-router-dom';
import '../styles/Navbar.css';

export default function Navbar({ user, onLogout }) {
  return (
    <nav className="top-navbar hide-mobile">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="logo-icon">🎨</span>
          <span className="logo-text">AI Instagram</span>
        </Link>

        <div className="nav-search-container">
          <span className="nav-search-icon">🔍</span>
          <input type="text" placeholder="Search" className="nav-search-input" />
        </div>

        <div className="nav-icons">
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </div>
    </nav>
  );
}
