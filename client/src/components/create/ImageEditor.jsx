import { useState, useRef } from 'react';
import ReactCrop, { makeAspectCrop, centerCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import styles from './ImageEditor.module.css';

const RATIOS = [
  { label: 'Original', value: null },
  { label: '1:1',      value: 1 },
  { label: '4:5',      value: 4 / 5 },
  { label: '16:9',     value: 16 / 9 },
];

export default function ImageEditor({ src, onNext }) {
  const imgRef = useRef(null);
  const [crop, setCrop] = useState(undefined);
  const [completedCrop, setCompletedCrop] = useState(undefined);
  const [aspect, setAspect] = useState(1);
  const [tab, setTab] = useState('crop');
  const [adj, setAdj] = useState({ brightness: 100, contrast: 100, saturation: 100 });

  const onImageLoad = (e) => {
    const { width, height } = e.currentTarget;
    setCrop(centerCrop(makeAspectCrop({ unit: '%', width: 90 }, 1, width, height), width, height));
  };

  const changeAspect = (a) => {
    setAspect(a);
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      if (a !== null) {
        setCrop(centerCrop(makeAspectCrop({ unit: '%', width: 90 }, a, width, height), width, height));
      } else {
        setCrop(undefined);
      }
    }
  };

  const handleNext = async () => {
    let blob = null;
    const img = imgRef.current;
    if (img && completedCrop?.width && completedCrop?.height) {
      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(completedCrop.width * scaleX);
      canvas.height = Math.floor(completedCrop.height * scaleY);
      const ctx = canvas.getContext('2d');
      // Apply brightness/contrast/saturation adjustments to the cropped canvas
      ctx.filter = `brightness(${adj.brightness}%) contrast(${adj.contrast}%) saturate(${adj.saturation}%)`;
      ctx.drawImage(
        img,
        Math.floor(completedCrop.x * scaleX),
        Math.floor(completedCrop.y * scaleY),
        canvas.width,
        canvas.height,
        0, 0,
        canvas.width,
        canvas.height,
      );
      blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
    }
    onNext({ blob, adjustments: adj });
  };

  const filterPreview = `brightness(${adj.brightness}%) contrast(${adj.contrast}%) saturate(${adj.saturation}%)`;

  return (
    <div className={styles.editor}>
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'crop' ? styles.active : ''}`}
          onClick={() => setTab('crop')}
        >
          Crop
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'adjust' ? styles.active : ''}`}
          onClick={() => setTab('adjust')}
        >
          Adjust
        </button>
      </div>

      <div className={styles.canvasWrap}>
        <ReactCrop
          crop={crop}
          onChange={(_, pct) => setCrop(pct)}
          onComplete={(px) => setCompletedCrop(px)}
          {...(aspect !== null ? { aspect } : {})}
        >
          <img
            ref={imgRef}
            src={src}
            onLoad={onImageLoad}
            alt="Edit"
            className={styles.editImg}
            style={{ filter: filterPreview }}
          />
        </ReactCrop>
      </div>

      {tab === 'crop' ? (
        <div className={styles.ratioRow}>
          {RATIOS.map(r => (
            <button
              key={r.label}
              type="button"
              className={`${styles.ratioBtn} ${aspect === r.value ? styles.active : ''}`}
              onClick={() => changeAspect(r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>
      ) : (
        <div className={styles.sliders}>
          {['brightness', 'contrast', 'saturation'].map(key => (
            <div key={key} className={styles.sliderRow}>
              <label className={styles.sliderLabel}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </label>
              <input
                type="range"
                min="0"
                max="200"
                value={adj[key]}
                onChange={e => setAdj(a => ({ ...a, [key]: Number(e.target.value) }))}
                className={styles.range}
              />
              <span className={styles.sliderVal}>{adj[key]}%</span>
            </div>
          ))}
          <button
            type="button"
            className={styles.resetBtn}
            onClick={() => setAdj({ brightness: 100, contrast: 100, saturation: 100 })}
          >
            Reset
          </button>
        </div>
      )}

      <div className={styles.footer}>
        <button type="button" className={styles.nextBtn} onClick={handleNext}>
          Next →
        </button>
      </div>
    </div>
  );
}
