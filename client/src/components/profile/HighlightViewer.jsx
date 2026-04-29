'use client';

import { useState, useEffect } from 'react';
import { SafeImage } from '../../utils/media';
import styles from './HighlightViewer.module.css';

export default function HighlightViewer({ highlight, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const stories = highlight.stories || [];
  const currentStory = stories[currentIndex];

  useEffect(() => {
    if (!currentStory || isPaused) return;
    
    const duration = currentStory.mediaType === 'video' ? 15000 : 5000;
    const increment = 100 / (duration / 100);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
            return 0;
          } else {
            onClose();
            return 0;
          }
        }
        return prev + increment;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [currentIndex, currentStory, isPaused, stories.length, onClose]);

  const handleTap = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    
    // Tap top 20% to pause/unpause
    if (clientY < innerHeight * 0.2) {
      setIsPaused(!isPaused);
    } else if (clientX < innerWidth * 0.3) {
      // Go to previous
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
        setProgress(0);
      }
    } else if (clientX > innerWidth * 0.7) {
      // Go to next
      if (currentIndex < stories.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setProgress(0);
      } else {
        onClose();
      }
    }
  };

  if (!currentStory) return null;

  return (
    <div className={styles.highlightViewer} onClick={handleTap}>
      {/* Progress bars */}
      <div className={styles.progressContainer}>
        {stories.map((_, idx) => (
          <div key={idx} className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ 
                width: idx === currentIndex ? `${progress}%` : 
                       idx < currentIndex ? '100%' : '0%'
              }}
            />
          </div>
        ))}
      </div>
      
      {/* Header */}
      <div className={styles.header}>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className={styles.closeButton}>←</button>
        <div className={styles.highlightInfo}>
          <span className={styles.highlightName}>{highlight.name}</span>
          <span className={styles.storyDate}>
            {new Date(currentStory.createdAt).toLocaleDateString()}
          </span>
        </div>
        <button className={styles.menuButton} onClick={(e) => e.stopPropagation()}>⋮</button>
      </div>
      
      {/* Story content */}
      <div className={styles.content}>
        {currentStory.mediaType === 'video' ? (
          <video src={currentStory.mediaUrl} autoPlay playsInline className={styles.media} />
        ) : (
          <SafeImage src={currentStory.mediaUrl} alt="" className={styles.media} />
        )}
        
        {/* Music/audio info */}
        {currentStory.audioUrl && (
          <div className={styles.audioInfo}>
            🎵 {currentStory.audioUrl.split('/').pop() || 'Original Audio'}
          </div>
        )}
        
        {/* Caption/text */}
        {currentStory.text && (
          <div className={styles.caption}>
            {currentStory.text}
          </div>
        )}
      </div>
      
      {/* Reply input */}
      <div className={styles.replyContainer} onClick={(e) => e.stopPropagation()}>
        <input type="text" placeholder="Send message" className={styles.replyInput} />
        <button className={styles.sendButton}>Send</button>
      </div>
    </div>
  );
}
