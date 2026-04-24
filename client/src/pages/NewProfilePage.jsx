import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileStats from '../components/profile/ProfileStats';
import ProfileActions from '../components/profile/ProfileActions';
import HighlightsSection from '../components/profile/HighlightsSection';
import ProfileTabs from '../components/profile/ProfileTabs';
import PostGrid from '../components/profile/PostGrid';
import styles from './NewProfilePage.module.css';

export default function NewProfilePage() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/profile/${userId}`);
      setProfile(response.data.profile);
      setPosts(response.data.posts);
      setIsOwnProfile(response.data.isOwnProfile);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    try {
      // If it's the 'posts' tab, we can use the main profile data or re-fetch
      if (tab === 'posts') {
        fetchProfile();
        return;
      }
      
      const response = await api.get(`/profile/${userId}/${tab}`);
      setPosts(response.data.items || []);
    } catch (error) {
      console.error(`Failed to fetch ${tab}:`, error);
    }
  };

  if (loading) return <div className={styles.loading}>Loading profile...</div>;
  if (!profile) return <div className={styles.error}>Profile not found</div>;

  return (
    <div className={styles.profilePage}>
      <div className={styles.container}>
        <ProfileHeader 
          profile={profile} 
          isOwnProfile={isOwnProfile}
        />
        
        <ProfileStats 
          stats={profile.stats}
          isOwnProfile={isOwnProfile}
        />
        
        <ProfileActions 
          profile={profile}
          isOwnProfile={isOwnProfile}
        />
        
        <HighlightsSection 
          highlights={profile.highlights}
          isOwnProfile={isOwnProfile}
        />
        
        <ProfileTabs 
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isOwnProfile={isOwnProfile}
        />
        
        <PostGrid 
          posts={posts}
          type={activeTab}
        />
      </div>
    </div>
  );
}
