import { useState, useEffect, useRef } from 'react';
import { fetchStoryTray, fetchUserStories, markStorySeen } from '../services/storyService';
import useAuth from '../hooks/useAuth';
import StoryViewer from './StoryViewer';
import { SafeImage } from '../utils/media';
import '../styles/StoriesTray.css';

export default function StoriesTray() {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStoryGroup, setActiveStoryGroup] = useState(null);
  const scrollRef = useRef(null);

  const loadTray = () => {
    fetchStoryTray()
      .then((data) => data.success && setStories(data.stories))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTray();
  }, []);

  const handleStoryClick = async (storyGroup) => {
    try {
      const data = await fetchUserStories(storyGroup.userId);
      if (data.success && data.stories.length > 0) {
        setActiveStoryGroup(data.stories);
      }
    } catch (err) {
      console.error('Failed to load user stories:', err);
    }
  };

  const handleStorySeen = async (storyId) => {
    try {
      await markStorySeen(storyId);
      // Optionally update local state to show as seen
      setStories(prev => prev.map(s => {
        if (activeStoryGroup && activeStoryGroup[0].userId === s.userId) {
          return { ...s, seen: true };
        }
        return s;
      }));
    } catch (err) {
      console.error('Failed to mark story seen:', err);
    }
  };

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 200, behavior: 'smooth' });
  };

  if (loading) return <div className="stories-tray stories-tray--loading">Loading stories…</div>;

  return (
    <div className="stories-tray">
      <div className="stories-scroll" ref={scrollRef}>
        {/* Your Story */}
        <div className="story-item">
          <button className="story-btn" onClick={() => (window.location.href = '/create?type=story')}>
            <div className="story-ring story-ring--add">
              <div className="story-avatar">
                <SafeImage
                  src={user?.avatarUrl}
                  alt="Your story"
                />
                <div className="story-add-icon">+</div>
              </div>
            </div>
            <span className="story-username">Your Story</span>
          </button>
        </div>

        {stories.map((story) => (
          <div key={story.userId} className="story-item">
            <button
              className="story-btn"
              onClick={() => handleStoryClick(story)}
            >
              <div className={`story-ring${story.seen ? ' story-ring--seen' : ''}`}>
                <div className="story-avatar">
                  <SafeImage
                    src={story.avatar}
                    alt={story.username}
                  />
                </div>
              </div>
              <span className="story-username">
                {story.username.length > 10 ? story.username.slice(0, 10) + '…' : story.username}
              </span>
            </button>
          </div>
        ))}
      </div>

      <button className="stories-scroll-btn stories-scroll-btn--left" onClick={() => scroll(-1)}>‹</button>
      <button className="stories-scroll-btn stories-scroll-btn--right" onClick={() => scroll(1)}>›</button>

      {activeStoryGroup && (
        <StoryViewer 
          stories={activeStoryGroup} 
          onClose={() => setActiveStoryGroup(null)}
          onStorySeen={handleStorySeen}
        />
      )}
    </div>
  );
}
