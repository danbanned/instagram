import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { createStory } from '../services/storyService';
import styles from './StoryCreator.module.css';

export default function StoryCreator({ onClose, onCreated }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewType, setPreviewType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError('');
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setPreviewType(f.type.startsWith('video') ? 'video' : 'image');
  };

  const handleShare = async () => {
    if (!file || loading) return;
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('media', file);
      const result = await createStory(formData);
      if (onCreated) onCreated(result.story);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to post story.');
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.title}>Create Story</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {!preview ? (
          <div className={styles.picker}>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,video/*"
              className={styles.fileInput}
              onChange={handleFile}
            />
            <button className={styles.selectBtn} onClick={() => inputRef.current?.click()}>
              <span className={styles.selectIcon}>+</span>
              <span>Select Photo or Video</span>
            </button>
          </div>
        ) : (
          <div className={styles.previewArea}>
            {previewType === 'video' ? (
              <video src={preview} className={styles.previewMedia} controls muted />
            ) : (
              <img src={preview} className={styles.previewMedia} alt="Story preview" />
            )}
            <button
              className={styles.changeBtn}
              onClick={() => { setFile(null); setPreview(null); }}
            >
              Change
            </button>
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.footer}>
          <button
            className={styles.shareBtn}
            disabled={!file || loading}
            onClick={handleShare}
          >
            {loading ? 'Sharing…' : 'Share to Story'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
