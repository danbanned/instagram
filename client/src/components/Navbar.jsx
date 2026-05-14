import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { SafeImage } from '../utils/media';
import '../styles/Navbar.css';

export default function Navbar({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], hashtags: [], posts: [], locations: [] });
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef(null);
  const isSearchPage = location.pathname === '/search';
  const hasResults = useMemo(
    () => [results.users.length, results.hashtags.length, results.posts.length, results.locations.length].some(Boolean),
    [results.hashtags.length, results.locations.length, results.posts.length, results.users.length]
  );

  useEffect(() => {
    if (isSearchPage) {
      setShowDropdown(false);
      return undefined;
    }

    if (!query.trim() || query.trim().length < 2) {
      setResults({ users: [], hashtags: [], posts: [], locations: [] });
      setShowDropdown(false);
      return undefined;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/search?q=${encodeURIComponent(query.trim())}&type=top&limit=5`);
        setResults({
          users: response.data.users || [],
          hashtags: response.data.hashtags || [],
          posts: response.data.posts || [],
          locations: response.data.locations || []
        });
        setShowDropdown(true);
      } catch (error) {
        console.error('Navbar search failed:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [isSearchPage, query]);

  useEffect(() => {
    const handleClick = (event) => {
      if (!searchRef.current?.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    setShowDropdown(false);
  };

  const handleResultNavigate = (path) => {
    navigate(path);
    setShowDropdown(false);
  };

  return (
    <nav className="top-navbar hide-mobile">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="logo-icon">🎨</span>
          <span className="logo-text">AI Instagram</span>
        </Link>

        {!isSearchPage && (
          <div className="nav-search-container" ref={searchRef}>
            <form className="nav-search-form" onSubmit={handleSubmit}>
              <span className="nav-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search users, posts, hashtags"
                className="nav-search-input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => hasResults && setShowDropdown(true)}
              />
              {isLoading && <span className="nav-search-loading">...</span>}
            </form>

            {showDropdown && hasResults && (
              <div className="nav-search-dropdown">
                {results.users.slice(0, 3).map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    className="nav-search-result"
                    onClick={() => handleResultNavigate(`/profile/${result.id}`)}
                  >
                    <SafeImage src={result.avatar || '/default-avatar.png'} alt={result.username} className="nav-search-avatar" />
                    <div className="nav-search-meta">
                      <strong>{result.username}</strong>
                      <span>{result.name || result.username}</span>
                    </div>
                  </button>
                ))}

                {results.hashtags.slice(0, 2).map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    className="nav-search-result"
                    onClick={() => handleResultNavigate(`/hashtag/${result.name}`)}
                  >
                    <span className="nav-search-hash">#</span>
                    <div className="nav-search-meta">
                      <strong>#{result.name}</strong>
                      <span>{result.postsCount} posts</span>
                    </div>
                  </button>
                ))}

                {results.posts.slice(0, 2).map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    className="nav-search-result"
                    onClick={() => handleResultNavigate(`/search?q=${encodeURIComponent(query.trim())}`)}
                  >
                    <SafeImage src={result.mediaUrl} alt={result.caption || result.user.username} className="nav-search-avatar nav-search-post-thumb" />
                    <div className="nav-search-meta">
                      <strong>{result.user.username}</strong>
                      <span>{result.caption || 'Matching post'}</span>
                    </div>
                  </button>
                ))}

                {results.locations.slice(0, 2).map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    className="nav-search-result"
                    onClick={() => handleResultNavigate(`/search?q=${encodeURIComponent(result.name)}`)}
                  >
                    <span className="nav-search-hash">📍</span>
                    <div className="nav-search-meta">
                      <strong>{result.name}</strong>
                      <span>{[result.country, `${result.postCount} posts`].filter(Boolean).join(' · ')}</span>
                    </div>
                  </button>
                ))}

                <div className="nav-search-footer">
                  <button type="submit" onClick={handleSubmit}>
                    View all results for "{query.trim()}"
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="nav-icons">
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </div>
    </nav>
  );
}
