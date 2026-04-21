import { useState, useEffect } from 'react';
import { SafeImage } from '../utils/media';
import '../styles/StoryViewer.css';

export default function StoryViewer({ stories, initialIndex = 0, onClose, onStorySeen }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);

  const currentStory = stories[currentIndex];

  useEffect(() => {
    if (!currentStory) return;

    // Reset progress when story changes
    setProgress(0);

    const duration = 5000; // 5 seconds per story
    const interval = 50;
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          handleNext();
          return 100;
        }
        return prev + increment;
      });
    }, interval);

    // Mark as seen
    if (onStorySeen) {
      onStorySeen(currentStory.id);
    }

    return () => clearInterval(timer);
  }, [currentIndex, stories]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!currentStory) return null;

  return (
    <div className="story-viewer-overlay">
      <div className="story-viewer-container">
        {/* Progress Bars */}
        <div className="story-progress-container">
          {stories.map((_, idx) => (
            <div key={idx} className="story-progress-bg">
              <div 
                className="story-progress-fill"
                style={{ 
                  width: `${idx === currentIndex ? progress : idx < currentIndex ? 100 : 0}%` 
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="story-viewer-header">
          <div className="story-viewer-user">
            <SafeImage 
              src={currentStory.user?.avatarUrl} 
              className="story-viewer-avatar"
            />
            <span className="story-viewer-username">{currentStory.user?.username}</span>
          </div>
          <button className="story-viewer-close" onClick={onClose}>✕</button>
        </div>

        {/* Content */}
        <div className="story-viewer-content">
          <SafeImage 
            src={currentStory.mediaUrl} 
            className="story-viewer-media"
            alt="Story content"
          />
        </div>

        {/* Navigation Taps */}
        <div className="story-viewer-nav">
          <div className="story-viewer-tap-left" onClick={handlePrev} />
          <div className="story-viewer-tap-right" onClick={handleNext} />
        </div>
      </div>
    </div>
  );
}
