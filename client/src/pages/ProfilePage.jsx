import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchUserProfile, fetchUserPosts } from '../services/userService';
import { toggleFollow } from '../services/postService';
import useAuth from '../hooks/useAuth';
import { SafeImage } from '../utils/media';
import '../styles/ProfilePage.css';

export default function ProfilePage() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const [userData, postsData] = await Promise.all([
          fetchUserProfile(userId),
          fetchUserPosts(userId)
        ]);
        if (userData.success) setUser(userData.user);
        if (postsData.success) setPosts(postsData.posts);
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

  if (loading) return <div className="centered">Loading profile...</div>;
  if (!user) return <div className="centered">User not found</div>;

  const isOwnProfile = currentUser?.id === user.id;

  return (
    <main className="profile-column">
      <div className="profile-container">
        <header className="profile-header">
          <div className="profile-avatar-container">
            <SafeImage src={user.avatarUrl} className="profile-avatar" />
          </div>
          
          <section className="profile-info">
            <div className="profile-username-row">
              <h2>{user.username}</h2>
              {isOwnProfile ? (
                <button className="edit-profile-btn">Edit Profile</button>
              ) : (
                <button 
                  className={`follow-btn ${user.isFollowing ? 'following' : ''}`}
                  onClick={handleFollow}
                >
                  {user.isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
            
            <div className="profile-stats">
              <span><strong>{user.postsCount}</strong> posts</span>
              <span><strong>{user.followersCount}</strong> followers</span>
              <span><strong>{user.followingCount}</strong> following</span>
            </div>
            
            <div className="profile-bio">
              <p>{user.bio}</p>
            </div>
          </section>
        </header>
        
        <div className="profile-tabs">
          <button 
            className={activeTab === 'posts' ? 'active' : ''} 
            onClick={() => setActiveTab('posts')}
          >
            POSTS
          </button>
          <button 
            className={activeTab === 'saved' ? 'active' : ''} 
            onClick={() => setActiveTab('saved')}
          >
            SAVED
          </button>
        </div>
        
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
      </div>
    </main>
  );
}
