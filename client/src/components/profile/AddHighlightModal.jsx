'use client';

import { useState, useEffect } from 'react';
import { fetchArchivedStories, createHighlight, updateHighlight } from '../../services/highlightService';
import { SafeImage } from '../../utils/media';
import styles from './AddHighlightModal.module.css';

export default function AddHighlightModal({ isOpen, onClose, onSave, editingHighlight = null }) {
  const [name, setName] = useState('');
  const [stories, setStories] = useState([]);
  const [selectedStoryIds, setSelectedStoryIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Select stories, 2: Name & Cover

  useEffect(() => {
    if (isOpen) {
      loadStories();
      if (editingHighlight) {
        setName(editingHighlight.name);
        setSelectedStoryIds(editingHighlight.stories.map(s => s.id));
        setStep(2);
      } else {
        setName('');
        setSelectedStoryIds([]);
        setStep(1);
      }
    }
  }, [isOpen, editingHighlight]);

  const loadStories = async () => {
    setLoading(true);
    try {
      const data = await fetchArchivedStories();
      setStories(data.stories || []);
    } catch (error) {
      console.error('Failed to load stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStorySelection = (storyId) => {
    setSelectedStoryIds(prev => 
      prev.includes(storyId) 
        ? prev.filter(id => id !== storyId) 
        : [...prev, storyId]
    );
  };

  const handleNext = () => {
    if (selectedStoryIds.length === 0) {
      alert('Please select at least one story');
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a name for the highlight');
      return;
    }

    setLoading(true);
    try {
      const coverUrl = stories.find(s => s.id === selectedStoryIds[0])?.mediaUrl || '';
      const highlightData = {
        name,
        coverUrl,
        storyIds: selectedStoryIds
      };

      let result;
      if (editingHighlight) {
        result = await updateHighlight(editingHighlight.id, highlightData);
      } else {
        result = await createHighlight(highlightData);
      }

      onSave(result.highlight);
      onClose();
    } catch (error) {
      console.error('Failed to save highlight:', error);
      alert('Error saving highlight');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          {step === 2 && <button className={styles.backBtn} onClick={handleBack}>←</button>}
          <h3>{editingHighlight ? 'Edit Highlight' : 'New Highlight'}</h3>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.modalBody}>
          {step === 1 ? (
            <div className={styles.storiesGrid}>
              {stories.map(story => (
                <div 
                  key={story.id} 
                  className={`${styles.storyItem} ${selectedStoryIds.includes(story.id) ? styles.selected : ''}`}
                  onClick={() => toggleStorySelection(story.id)}
                >
                  <SafeImage src={story.mediaUrl} className={styles.storyThumb} />
                  <div className={styles.checkbox}>
                    {selectedStoryIds.includes(story.id) && <span>✓</span>}
                  </div>
                </div>
              ))}
              {stories.length === 0 && !loading && (
                <div className={styles.emptyMessage}>No stories found in your archive.</div>
              )}
            </div>
          ) : (
            <div className={styles.detailsForm}>
              <div className={styles.coverPreview}>
                <SafeImage 
                  src={stories.find(s => s.id === selectedStoryIds[0])?.mediaUrl || '/default-highlight.png'} 
                  className={styles.largeCover}
                />
                <span>Edit Cover</span>
              </div>
              <input
                type="text"
                placeholder="Highlight Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={15}
                className={styles.nameInput}
                autoFocus
              />
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          {step === 1 ? (
            <button className={styles.nextBtn} onClick={handleNext}>Next</button>
          ) : (
            <button className={styles.doneBtn} onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : (editingHighlight ? 'Done' : 'Add')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
