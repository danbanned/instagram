import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import ProfileHeader from '../components/profile/ProfileHeader';
import HighlightsSection from '../components/profile/HighlightsSection';
import ProfileTabs from '../components/profile/ProfileTabs';
import PostGrid from '../components/profile/PostGrid';
import EditProfileModal from '../components/profile/EditProfileModal';
import PostDetailModal from '../components/profile/PostDetailModal';
import styles from './NewProfilePage.module.css';

export default function NewProfilePage() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArchiveMessage, setShowArchiveMessage] = useState(false);

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

  const fetchPostDetail = async (postId) => {
    const response = await api.get(`/posts/${postId}`);
    return response.data.post;
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

  const handlePostClick = async (post) => {
    try {
      const detail = await fetchPostDetail(post.id);
      setSelectedPost(detail);
    } catch (error) {
      console.error('Failed to fetch post detail:', error);
      setSelectedPost(post);
    }
  };

  const handlePostAction = async (action, post) => {
    if (!post?.id) return;

    try {
      if (action === 'delete') {
        const confirmed = window.confirm('Delete this post?');
        if (!confirmed) return;
        await api.delete(`/posts/${post.id}`);
        setSelectedPost(null);
      }

      if (action === 'pin') {
        const response = await api.post(`/posts/${post.id}/pin`, { pinned: !post.isPinned });
        setSelectedPost(response.data.post);
      }

      if (action === 'toggleLikeVisibility') {
        const response = await api.patch(`/posts/${post.id}`, { hideLikeCount: !post.hideLikeCount });
        setSelectedPost(response.data.post);
      }

      if (action === 'toggleComments') {
        const response = await api.patch(`/posts/${post.id}`, { commentsDisabled: !post.commentsDisabled });
        setSelectedPost(response.data.post);
      }

      if (action === 'copyLink') {
        await navigator.clipboard.writeText(`${window.location.origin}/profile/${userId}?post=${post.id}`);
      }

      if (action === 'edit') {
        const nextCaption = window.prompt('Edit caption', post.caption || '');
        if (nextCaption === null) return;
        const response = await api.patch(`/posts/${post.id}`, { caption: nextCaption });
        setSelectedPost(response.data.post);
      }

      if (action === 'share') {
        await api.post(`/posts/${post.id}/share`);
      }

      if (action === 'goToPost') {
        const detail = await fetchPostDetail(post.id);
        setSelectedPost(detail);
      }

      if (action === 'embed' || action === 'about') {
        window.alert(`${action === 'embed' ? 'Embed' : 'About this account'} is not wired yet.`);
      }

      if (['delete', 'pin', 'toggleLikeVisibility', 'toggleComments', 'edit'].includes(action)) {
        if (activeTab === 'posts') {
          await fetchProfile();
        } else {
          await handleTabChange(activeTab);
        }
      }
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
    }
  };

  const handleCommentSubmit = async (postId, text) => {
    const response = await api.post(`/posts/${postId}/comments`, { text });
    setSelectedPost((prev) => {
      if (!prev || prev.id !== postId) return prev;
      return {
        ...prev,
        comments: [...(prev.comments || []), response.data],
        commentsCount: (prev.commentsCount || 0) + 1,
      };
    });
    setPosts((prev) => prev.map((item) => (
      item.id === postId
        ? { ...item, commentsCount: (item.commentsCount || 0) + 1 }
        : item
    )));
  };

  const collections = [
    { id: 'all', name: 'All Posts', count: posts.length || 0 },
    { id: 'travel', name: 'travel', count: 23 },
    { id: 'family', name: 'Family', count: 12 },
  ];

  if (loading) return <div className={styles.loading}>Loading profile...</div>;
  if (!profile) return <div className={styles.error}>Profile not found</div>;

  return (
    <div className={styles.profilePage}>
      <div className={styles.container}>
        <ProfileHeader 
          profile={profile} 
          stats={profile.stats}
          isOwnProfile={isOwnProfile}
          onOpenEditProfile={() => setShowEditModal(true)}
          onOpenArchive={() => setShowArchiveMessage(true)}
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
          isOwnProfile={isOwnProfile}
          onPostClick={handlePostClick}
          onPostAction={handlePostAction}
        />

        {activeTab === 'saved' && isOwnProfile && (
          <section className={styles.collectionsSection}>
            <div className={styles.collectionsHeader}>
              <p>Only you can see what you&apos;ve saved</p>
              <button type="button" className={styles.collectionButton}>+ New Collection</button>
            </div>
            <div className={styles.collectionsGrid}>
              {collections.map((collection) => (
                <button key={collection.id} type="button" className={styles.collectionCard}>
                  <div className={styles.collectionPreview}>
                    <span>📷</span>
                  </div>
                  <div className={styles.collectionMeta}>
                    <strong>{collection.name}</strong>
                    <span>{collection.count} posts</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className={styles.messagesSection}>
          <button type="button" className={styles.messagesButton}>
            Messages
          </button>
        </section>
      </div>

      <EditProfileModal
        profile={profile}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={(updatedProfile) => setProfile((prev) => ({ ...prev, ...updatedProfile }))}
      />

      <PostDetailModal
        post={selectedPost}
        isOpen={!!selectedPost}
        isOwnProfile={isOwnProfile}
        onClose={() => setSelectedPost(null)}
        onAction={handlePostAction}
        onCommentSubmit={handleCommentSubmit}
      />

      {showArchiveMessage && (
        <div className={styles.archiveBanner}>
          Archive view is not routed yet. The button is wired and ready for the archive screen when that route exists.
          <button type="button" onClick={() => setShowArchiveMessage(false)}>Dismiss</button>
        </div>
      )}
    </div>
  );
}
