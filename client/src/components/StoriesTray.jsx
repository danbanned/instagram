import { useState, useEffect, useRef } from 'react';
import { fetchStoryTray, fetchUserStories, markStorySeen } from '../services/storyService';
import useAuth from '../hooks/useAuth';
import StoryViewer from './StoryViewer';
import StoryCreator from './StoryCreator';
import { SafeImage } from '../utils/media';
import '../styles/StoriesTray.css';

export default function StoriesTray() {
  const { user } = useAuth();
  const [tray, setTray] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingIndex, setViewingIndex] = useState(null); // index into combined [ownStories, ...tray]
  const [activeStories, setActiveStories] = useState(null);
  const [showCreator, setShowCreator] = useState(false);
  const [ownStories, setOwnStories] = useState([]);
  const scrollRef = useRef(null);

  const loadTray = async () => {
    try {
      const [trayData, ownData] = await Promise.all([
        fetchStoryTray(),
        user?.id ? fetchUserStories(user.id) : Promise.resolve({ success: false, stories: [] }),
      ]);
      if (trayData.success) setTray(trayData.stories);
      if (ownData.success) setOwnStories(ownData.stories);
    } catch (err) {
      console.error('Failed to load story tray:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTray();
    const interval = setInterval(loadTray, 60000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Opens own stories for viewing, or creator if none exist
  const handleOwnStoryClick = async () => {
    if (ownStories.length > 0) {
      setViewingIndex(0);
      setActiveStories(ownStories);
    } else {
      setShowCreator(true);
    }
  };

  const handleClose = () => {
    setActiveStories(null);
    setViewingIndex(null);
  };

  // Combined slot order: own stories = index 0 (if any), tray users start at index (ownStories.length > 0 ? 1 : 0)
  const trayOffset = ownStories.length > 0 ? 1 : 0;
  const totalSlots = trayOffset + tray.length;

  const handleNext = async () => {
    const next = viewingIndex + 1;
    if (next >= totalSlots) { handleClose(); return; }
    if (next === 0) { setViewingIndex(0); setActiveStories(ownStories); return; }
    const trayIdx = next - trayOffset;
    await openStoriesByTrayIndex(trayIdx, next);
  };

  const handlePrevious = async () => {
    const prev = viewingIndex - 1;
    if (prev < 0) return;
    if (prev === 0 && trayOffset === 1) { setViewingIndex(0); setActiveStories(ownStories); return; }
    const trayIdx = prev - trayOffset;
    await openStoriesByTrayIndex(trayIdx, prev);
  };

  const openStoriesByTrayIndex = async (trayIdx, slotIndex) => {
    try {
      const group = tray[trayIdx];
      const data = await fetchUserStories(group.userId);
      if (data.success && data.stories.length > 0) {
        setViewingIndex(slotIndex);
        setActiveStories(data.stories);
      }
    } catch (err) {
      console.error('Failed to load user stories:', err);
    }
  };

  const handleStorySeen = async (storyId) => {
    try {
      await markStorySeen(storyId);
      if (viewingIndex !== null && viewingIndex >= trayOffset) {
        const trayIdx = viewingIndex - trayOffset;
        setTray(prev => prev.map((s, i) =>
          i === trayIdx ? { ...s, seen: true } : s
        ));
      }
    } catch {
      // ignore
    }
  };

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 200, behavior: 'smooth' });
  };

  if (loading) return <div className="stories-tray stories-tray--loading">Loading stories…</div>;

  const hasOwnStories = ownStories.length > 0;

  return (
    <div className="stories-tray">
      <div className="stories-scroll" ref={scrollRef}>
        {/* Your Story */}
        <div className="story-item">
          <div className="story-own-wrapper">
            <button className="story-btn" onClick={handleOwnStoryClick}>
              <div className={hasOwnStories ? 'story-ring' : 'story-ring story-ring--add'}>
                <div className="story-avatar">
                  <SafeImage src={user?.avatarUrl} alt="Your story" />
                  {!hasOwnStories && <div className="story-add-icon">+</div>}
                </div>
              </div>
            </button>
            {/* When stories exist, show a "+" badge to add more without entering the viewer */}
            {hasOwnStories && (
              <button
                className="story-add-badge"
                onClick={() => setShowCreator(true)}
                title="Add to story"
              >
                +
              </button>
            )}
          </div>
          <span className="story-username">Your Story</span>
        </div>

        {tray.map((story, i) => (
          <div key={story.userId} className="story-item">
            <button className="story-btn" onClick={() => openStoriesByTrayIndex(i, i + trayOffset)}>
              <div className={`story-ring${story.seen ? ' story-ring--seen' : ''}`}>
                <div className="story-avatar">
                  <SafeImage src={story.avatar} alt={story.username} />
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

      {activeStories && (
        <StoryViewer
          stories={activeStories}
          onClose={handleClose}
          onStorySeen={handleStorySeen}
          onNext={viewingIndex < totalSlots - 1 ? handleNext : null}
          onPrevious={viewingIndex > 0 ? handlePrevious : null}
        />
      )}

      {showCreator && (
        <StoryCreator
          onClose={() => setShowCreator(false)}
          onCreated={() => { setShowCreator(false); loadTray(); }}
        />
      )}
    </div>
  );
}
