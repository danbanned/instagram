'use client';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SafeImage } from '../../utils/media';
import styles from './HighlightsSection.module.css';

export default function HighlightsSection({ highlights = [], isOwnProfile }) {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const demoHighlights = [
    { id: 'family', name: 'Family', coverUrl: '' },
    { id: 'family-ch', name: 'Family ch...', coverUrl: '' },
    { id: 'friends', name: 'friends 🎉', coverUrl: '' },
    { id: 'years-ago', name: "Year's ago", coverUrl: '' },
    { id: 'travel', name: 'travel', coverUrl: '' },
    { id: 'little-sister', name: 'little sister', coverUrl: '' },
    { id: 'sister', name: 'Sister🦋', coverUrl: '' },
  ];
  const visibleHighlights = highlights.length ? highlights : (isOwnProfile ? demoHighlights : []);

  const handleHighlightClick = (highlight) => {
    navigate(`/highlights/${highlight.id}`);
  };

  const handleCreateHighlight = () => {
    setShowCreateModal(true);
  };

  if (visibleHighlights.length === 0 && !isOwnProfile) return null;

  return (
    <div className={styles.highlightsSection}>
      <div className={styles.highlightsHeader}>
        <span>Highlights</span>
        {isOwnProfile && (
          <button className={styles.newHighlightBtn} onClick={handleCreateHighlight}>
            New
          </button>
        )}
      </div>

      <div className={styles.highlightsGrid}>
        {visibleHighlights.map(highlight => (
          <button 
            key={highlight.id}
            className={styles.highlightItem}
            onClick={() => handleHighlightClick(highlight)}
          >
            <div className={styles.highlightCover}>
              <SafeImage src={highlight.coverUrl || '/default-highlight.png'} alt={highlight.name} />
              <div className={styles.highlightOverlay}>
                <span>📌</span>
              </div>
            </div>
            <span className={styles.highlightName}>{highlight.name}</span>
          </button>
        ))}

        {isOwnProfile && (
          <button className={styles.addHighlight} onClick={handleCreateHighlight}>
            <div className={styles.addIcon}>+</div>
            <span>New</span>
          </button>
        )}
      </div>

      {/* Create Highlight Modal */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Create Highlight</h3>
              <button onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div className={styles.modalContent}>
              <input 
                type="text" 
                placeholder="Highlight name"
                className={styles.highlightNameInput}
              />
              <div className={styles.selectStories}>
                <p>Select stories to add:</p>
                <div className={styles.storiesList}>
                  {/* List of archived stories would go here */}
                  <div className={styles.storyOption}>
                    <input type="checkbox" id="story1" />
                    <label htmlFor="story1">Story from April 22</label>
                  </div>
                </div>
              </div>
              <button className={styles.createButton} onClick={() => setShowCreateModal(false)}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
