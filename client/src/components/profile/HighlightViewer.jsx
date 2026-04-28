'use client';

import { useState, useEffect, useCallback } from 'react';
import { SafeImage } from '../../utils/media';
import styles from './HighlightViewer.module.css';

export default function HighlightViewer({ highlight, isOpen, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const stories = highlight?.stories || [];

  const handleNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  useEffect(() => {
    if (!isOpen || stories.length === 0) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + 1;
      });
    }, 50); // 5 seconds per story (100 * 50ms)

    return () => clearInterval(interval);
  }, [isOpen, stories.length, handleNext]);

  if (!isOpen || stories.length === 0) return null;

  const currentStory = stories[currentIndex];

  return (
    <div className={styles.viewerOverlay} onClick={onClose}>
      <div className={styles.viewerContainer} onClick={e => e.stopPropagation()}>
        {/* Progress Bars */}
        <div className={styles.progressContainer}>
          {stories.map((_, index) => (
            <div key={index} className={styles.progressBarBackground}>
              <div 
                className={styles.progressBarFill} 
                style={{ 
                  width: index === currentIndex ? `${progress}%` : index < currentIndex ? '100%' : '0%' 
                }} 
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className={styles.viewerHeader}>
          <div className={styles.userInfo}>
            <SafeImage src={highlight.coverUrl || '/default-highlight.png'} className={styles.highlightMiniCover} />
            <span className={styles.highlightName}>{highlight.name}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          <div className={styles.mediaWrapper}>
            {currentStory.mediaType === 'video' ? (
              <video src={currentStory.mediaUrl} autoPlay muted className={styles.media} />
            ) : (
              <SafeImage src={currentStory.mediaUrl} className={styles.media} />
            )}
          </div>

          {/* Navigation areas */}
          <div className={styles.navLeft} onClick={handlePrev} />
          <div className={styles.navRight} onClick={handleNext} />
        </div>
      </div>
    </div>
  );
}
