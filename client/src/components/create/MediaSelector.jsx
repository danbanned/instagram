import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import styles from './MediaSelector.module.css';

export default function MediaSelector({ files, onFilesChange, maxFiles = 10 }) {
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    const urls = files.map(f => ({
      url: URL.createObjectURL(f),
      isVideo: f.type.startsWith('video/'),
    }));
    setPreviews(urls);
    return () => urls.forEach(p => URL.revokeObjectURL(p.url));
  }, [files]);

  const onDrop = useCallback((accepted) => {
    onFilesChange([...files, ...accepted].slice(0, maxFiles));
  }, [files, onFilesChange, maxFiles]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'video/*': [] },
    noClick: files.length > 0,
    noKeyboard: files.length > 0,
  });

  const removeFile = (e, idx) => {
    e.stopPropagation();
    onFilesChange(files.filter((_, i) => i !== idx));
  };

  return (
    <div
      {...getRootProps()}
      className={`${styles.zone} ${isDragActive ? styles.dragActive : ''}`}
    >
      <input {...getInputProps()} />

      {files.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.icon}>🖼️</span>
          <p className={styles.title}>Drag photos and videos here</p>
          <button type="button" className={styles.selectBtn} onClick={open}>
            Select from computer
          </button>
          <p className={styles.hint}>Up to {maxFiles} files · JPEG PNG MP4 MOV</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {previews.map((p, i) => (
            <div key={i} className={styles.previewItem}>
              {p.isVideo
                ? <video src={p.url} className={styles.media} />
                : <img src={p.url} alt="" className={styles.media} />
              }
              <button
                type="button"
                className={styles.removeBtn}
                onClick={(e) => removeFile(e, i)}
              >
                ×
              </button>
              {previews.length > 1 && (
                <span className={styles.badge}>{i + 1}</span>
              )}
            </div>
          ))}
          {previews.length < maxFiles && (
            <button
              type="button"
              className={styles.addMore}
              onClick={(e) => { e.stopPropagation(); open(); }}
            >
              <span className={styles.addIcon}>+</span>
              <span>Add more</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
