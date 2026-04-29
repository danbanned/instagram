import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchUserProfile, fetchUserPosts } from '../services/userService';
import { toggleFollow } from '../services/postService';
import { fetchHighlights } from '../services/highlightService';
import useAuth from '../hooks/useAuth';
import { SafeImage } from '../utils/media';
import HighlightsSection from '../components/profile/HighlightsSection';
import StoryViewer from '../components/StoryViewer';
import '../styles/ProfilePage.css';

export default function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [showStoryViewer, setShowStoryViewer] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const [userData, postsData, highlightsData] = await Promise.all([
          fetchUserProfile(userId),
          fetchUserPosts(userId),
          fetchHighlights(userId)
        ]);
        if (userData.success) setUser(userData.user);
        if (postsData.success) setPosts(postsData.posts);
        if (highlightsData.success) setHighlights(highlightsData.highlights);
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  const handleFollow = async () => {
    try {
      const data = await toggleFollow(user.id);
      setUser(prev => ({
        ...prev,
        isFollowing: !prev.isFollowing,
        followersCount: prev.isFollowing ? prev.followersCount - 1 : prev.followersCount + 1
      }));
    } catch (err) {
      console.error('Follow failed:', err);
    }
  };

  const handleUpdateHighlights = async () => {
    try {
      const data = await fetchHighlights(userId);
      if (data.success) setHighlights(data.highlights);
    } catch (err) {
      console.error('Failed to update highlights:', err);
    }
  };

  if (loading) return <div className="centered">Loading profile...</div>;
  if (!user) return <div className="centered">User not found</div>;

  const isOwnProfile = currentUser?.id === user.id;
  const hasActiveStory = user.hasActiveStory;

  return (
    <main className="profile-column">
      <div className="profile-container">
        <header className="profile-header">
          <div className="profile-avatar-section">
            <div 
              className={`profile-story-ring ${hasActiveStory ? 'has-story' : ''}`}
              onClick={() => hasActiveStory && setShowStoryViewer(true)}
            >
              <SafeImage src={user.avatarUrl} className="profile-avatar" />
              {hasActiveStory && <div className="story-indicator">●</div>}
            </div>
          </div>
          
          <section className="profile-info">
            <div className="profile-username-row">
              <h2>{user.username}</h2>
              <div className="profile-actions-row">
                {isOwnProfile ? (
                  <>
                    <button className="edit-profile-btn" onClick={() => navigate('/settings/edit')}>Edit Profile</button>
                    <button className="settings-btn" onClick={() => navigate('/settings')} aria-label="Settings">⚙️</button>
                  </>
                ) : (
                  <>
                    <button 
                      className={`follow-btn ${user.isFollowing ? 'following' : ''}`}
                      onClick={handleFollow}
                    >
                      {user.isFollowing ? 'Following ▼' : 'Follow'}
                    </button>
                    <button className="message-btn">Message</button>
                    <button className="email-action-btn">Email ▼</button>
                  </>
                )}
              </div>
            </div>
            
            <div className="profile-stats">
              <span><strong>{user.postsCount}</strong> posts</span>
              <span><strong>{user.followersCount}</strong> followers</span>
              <span><strong>{user.followingCount}</strong> following</span>
            </div>

            <div className="follower-context">
               <span className="followers-text">
                Followed by <strong>experience</strong>, <strong>_interdensity</strong> and <strong>20 others</strong>
              </span>
            </div>
            
            <div className="profile-bio">
              <p className="full-name">{user.profile?.name}</p>
              <p className="bio-text">{user.bio}</p>
              
              {/* Contact info moved here from About tab */}
              {user.profile?.email && (
                <div className="email-link">
                  <a href={`mailto:${user.profile.email}`} className="email-address">
                    📧 {user.profile.email}
                  </a>
                </div>
              )}
              {user.profile?.phoneNumber && (
                <div className="phone-link" style={{ margin: '8px 0', fontSize: '14px' }}>
                  📞 {user.profile.phoneNumber}
                </div>
              )}
              {user.profile?.website && (
                <div className="website-link-container" style={{ margin: '8px 0' }}>
                  <a href={user.profile.website} target="_blank" rel="noopener noreferrer" className="website-link" style={{ color: '#00376b', textDecoration: 'none', fontSize: '14px' }}>
                    🔗 {user.profile.website.replace('https://', '')}
                  </a>
                </div>
              )}
              <div className="joined-date" style={{ margin: '8px 0', fontSize: '14px', color: '#8e8e8e' }}>
                📅 Joined {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>

            <div className="action-buttons-chips">
              {(user.profile?.actionButtons || ['results', 'podcast', 'free trainings', 'about']).map((btn, idx) => (
                <button key={idx} className="action-chip">{btn}</button>
              ))}
            </div>
          </section>
        </header>

        <HighlightsSection 
          highlights={highlights} 
          isOwnProfile={isOwnProfile} 
          onUpdate={handleUpdateHighlights}
        />
        
        <div className="profile-tabs">
          <button 
            className={activeTab === 'posts' ? 'active' : ''} 
            onClick={() => setActiveTab('posts')}
          >
            📷 POSTS
          </button>
          <button 
            className={activeTab === 'reels' ? 'active' : ''} 
            onClick={() => setActiveTab('reels')}
          >
            🎬 REELS
          </button>
          <button 
            className={activeTab === 'saved' ? 'active' : ''} 
            onClick={() => setActiveTab('saved')}
          >
            📌 SAVED
          </button>
          <button 
            className={activeTab === 'reposts' ? 'active' : ''} 
            onClick={() => setActiveTab('reposts')}
          >
            🔄 REPOSTS
          </button>
        </div>
        
        <div className="profile-content">
          {activeTab === 'posts' && (
            <div className="profile-posts-grid">
              {posts.map(post => (
                <div key={post.id} className="profile-post-item">
                  <SafeImage src={post.mediaUrl} alt={post.caption} />
                  <div className="post-overlay">
                    <span>❤️ {post.likesCount}</span>
                    <span>💬 {post.comments?.length || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Other tabs can be implemented similarly */}
        </div>
      </div>

      {showStoryViewer && (
        <StoryViewer 
          userId={user.id} 
          isOpen={showStoryViewer} 
          onClose={() => setShowStoryViewer(false)} 
        />
      )}
    </main>
  );
}
