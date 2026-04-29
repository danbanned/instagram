'use client';

import { useState } from 'react';
import { SafeImage } from '../../utils/media';
import AddHighlightModal from './AddHighlightModal';
import { deleteHighlight } from '../../services/highlightService';
import styles from './HighlightsSection.module.css';

export default function HighlightsSection({ highlights = [], isOwnProfile, onUpdate, onHighlightClick }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHighlight, setEditingHighlight] = useState(null);

  const handleEditHighlight = (e, highlight) => {
    e.stopPropagation();
    setEditingHighlight(highlight);
    setShowAddModal(true);
  };

  const handleDeleteHighlight = async (e, highlightId) => {
    e.stopPropagation();
    if (window.confirm('Delete this highlight?')) {
      try {
        await deleteHighlight(highlightId);
        onUpdate();
      } catch (error) {
        console.error('Failed to delete highlight:', error);
      }
    }
  };

  const handleSaveHighlight = () => {
    onUpdate();
    setShowAddModal(false);
    setEditingHighlight(null);
  };

  if (highlights.length === 0 && !isOwnProfile) return null;

  return (
    <div className={styles.highlightsSection}>
      <div className={styles.highlightsGrid}>
        {highlights.map(highlight => (
          <div key={highlight.id} className={styles.highlightWrapper}>
            <button 
              className={styles.highlightItem}
              onClick={() => onHighlightClick(highlight)}
            >
              <div className={styles.highlightRing}>
                <div className={styles.highlightCover}>
                  <SafeImage src={highlight.coverUrl || '/default-highlight.png'} alt={highlight.name} />
                </div>
              </div>
              <span className={styles.highlightName}>{highlight.name}</span>
            </button>
            
            {isOwnProfile && (
              <div className={styles.highlightActions}>
                <button className={styles.editBtn} onClick={(e) => handleEditHighlight(e, highlight)}>✏️</button>
                <button className={styles.deleteBtn} onClick={(e) => handleDeleteHighlight(e, highlight.id)}>🗑️</button>
              </div>
            )}
          </div>
        ))}

        {isOwnProfile && (
          <button className={styles.addHighlight} onClick={() => setShowAddModal(true)}>
            <div className={styles.addRing}>
              <div className={styles.addIcon}>+</div>
            </div>
            <span>New</span>
          </button>
        )}
      </div>

      <AddHighlightModal 
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingHighlight(null);
        }}
        onSave={handleSaveHighlight}
        editingHighlight={editingHighlight}
      />
    </div>
  );
}
