import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MediaSelector from '../components/create/MediaSelector';
import ImageEditor from '../components/create/ImageEditor';
import Filters from '../components/create/Filters';
import api from '../services/api';
import styles from './CreatePage.module.css';

const STEP = { SELECT: 1, CROP: 2, FILTERS: 3, DETAILS: 4 };

const STEP_TITLES = {
  [STEP.SELECT]:  'Create new post',
  [STEP.CROP]:    'Crop & adjust',
  [STEP.FILTERS]: 'Filters',
  [STEP.DETAILS]: 'New post',
};

const COMING_SOON = {
  reel:     { icon: '✨', label: 'Reels',     desc: 'Create and share short, entertaining videos with your followers.' },
  'ai-image': { icon: '🎨', label: 'AI Image',  desc: 'Generate stunning images from text prompts using AI.' },
  'ai-text':  { icon: '🤖', label: 'AI Text',   desc: 'Generate captions, hashtags, and post ideas with AI.' },
  live:     { icon: '🎥', label: 'Live Video', desc: 'Go live and connect with your followers in real time.' },
};

function ComingSoon({ type, onBack }) {
  const info = COMING_SOON[type] || { icon: '🚧', label: type, desc: 'This feature is coming soon.' };
  return (
    <div className={styles.comingSoon}>
      <span className={styles.comingSoonIcon}>{info.icon}</span>
      <h2 className={styles.comingSoonTitle}>{info.label}</h2>
      <p className={styles.comingSoonDesc}>{info.desc}</p>
      <p className={styles.comingSoonBadge}>Coming Soon</p>
      <button className={styles.comingSoonBack} onClick={onBack}>Go back</button>
    </div>
  );
}

export default function CreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'post';

  const [step, setStep]             = useState(STEP.SELECT);
  const [allFiles, setAllFiles]     = useState([]);
  const [mainFile, setMainFile]     = useState(null);   // final file to upload (may be cropped)
  const [previewUrl, setPreviewUrl] = useState('');
  const [filterCss, setFilterCss]   = useState('');
  const [details, setDetails]       = useState({
    caption: '',
    location: '',
    altText: '',
    hideLikeCount: false,
    commentsDisabled: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  if (type !== 'post' && COMING_SOON[type]) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.header}>
            <button className={styles.backBtn} onClick={() => navigate(-1)}>←</button>
            <h2 className={styles.title}>{COMING_SOON[type].label}</h2>
          </div>
          <ComingSoon type={type} onBack={() => navigate(-1)} />
        </div>
      </div>
    );
  }

  // Step 1 → 2: files chosen
  const handleFilesChange = (files) => {
    setAllFiles(files);
    if (files[0]) {
      setMainFile(files[0]);
      setPreviewUrl(URL.createObjectURL(files[0]));
      if (files.length > 0) setStep(STEP.CROP);
    }
  };

  // Step 2 → 3: crop/adjust done
  const handleEditorNext = ({ blob }) => {
    if (blob) {
      const croppedFile = new File([blob], mainFile?.name || 'image.jpg', { type: 'image/jpeg' });
      setMainFile(croppedFile);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    }
    setStep(STEP.FILTERS);
  };

  // Step 3 → 4: filter chosen
  const handleFilterNext = () => setStep(STEP.DETAILS);

  // Step 4: submit
  const handleShare = async () => {
    if (!mainFile) return;
    setSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('media', mainFile);
      if (details.caption)    formData.append('caption', details.caption);
      if (details.location)   formData.append('location', details.location);
      if (details.altText)    formData.append('altText', details.altText);
      formData.append('hideLikeCount',    String(details.hideLikeCount));
      formData.append('commentsDisabled', String(details.commentsDisabled));
      await api.post('/posts', formData);
      navigate('/');
    } catch (err) {
      console.error('Post creation error:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to create post. Please try again.';
      setError(msg);
      setSubmitting(false);
    }
  };

  const setDetail = (key, val) => setDetails(d => ({ ...d, [key]: val }));

  const goBack = () => setStep(s => Math.max(s - 1, STEP.SELECT));

  return (
    <div className={styles.page}>
      <div className={styles.card}>

        {/* Header */}
        <div className={styles.header}>
          {step > STEP.SELECT && (
            <button className={styles.backBtn} onClick={goBack}>←</button>
          )}
          <h2 className={styles.title}>{STEP_TITLES[step]}</h2>
          {step === STEP.CROP && (
            <button className={styles.actionBtn} onClick={() => handleEditorNext({ blob: null })}>
              Skip
            </button>
          )}
          {step === STEP.FILTERS && (
            <button className={styles.actionBtn} onClick={handleFilterNext}>Next</button>
          )}
          {step === STEP.DETAILS && (
            <button
              className={`${styles.actionBtn} ${styles.shareBtn}`}
              onClick={handleShare}
              disabled={submitting}
            >
              {submitting ? 'Sharing…' : 'Share'}
            </button>
          )}
        </div>

        {/* Step 1 — Select */}
        {step === STEP.SELECT && (
          <div className={styles.body}>
            <MediaSelector files={allFiles} onFilesChange={handleFilesChange} maxFiles={10} />
          </div>
        )}

        {/* Step 2 — Crop & Adjust */}
        {step === STEP.CROP && (
          <div className={styles.body}>
            <ImageEditor src={previewUrl} onNext={handleEditorNext} />
          </div>
        )}

        {/* Step 3 — Filters */}
        {step === STEP.FILTERS && (
          <div className={styles.body}>
            <Filters
              previewUrl={previewUrl}
              selectedFilter={filterCss}
              onFilterChange={setFilterCss}
            />
          </div>
        )}

        {/* Step 4 — Details */}
        {step === STEP.DETAILS && (
          <div className={`${styles.body} ${styles.detailsBody}`}>
            {/* Left: image preview */}
            <div className={styles.previewCol}>
              <img
                src={previewUrl}
                alt="Preview"
                className={styles.previewImg}
                style={filterCss ? { filter: filterCss } : undefined}
              />
              {allFiles.length > 1 && (
                <span className={styles.carouselBadge}>{allFiles.length} photos</span>
              )}
            </div>

            {/* Right: form */}
            <div className={styles.formCol}>
              {/* Caption */}
              <textarea
                className={styles.captionInput}
                placeholder="Write a caption…"
                value={details.caption}
                maxLength={2200}
                onChange={e => setDetail('caption', e.target.value)}
              />
              <div className={styles.charCount}>{details.caption.length}/2,200</div>

              {/* Location */}
              <input
                className={styles.field}
                type="text"
                placeholder="Add location"
                value={details.location}
                onChange={e => setDetail('location', e.target.value)}
              />

              {/* Accessibility */}
              <details className={styles.accordion}>
                <summary className={styles.accordionSummary}>Accessibility</summary>
                <div className={styles.accordionBody}>
                  <p className={styles.accordionHint}>
                    Alt text describes your photo for people with visual impairments.
                  </p>
                  <textarea
                    className={styles.field}
                    placeholder="Write alt text…"
                    value={details.altText}
                    onChange={e => setDetail('altText', e.target.value)}
                    rows={2}
                  />
                </div>
              </details>

              {/* Advanced Settings */}
              <details className={styles.accordion}>
                <summary className={styles.accordionSummary}>Advanced settings</summary>
                <div className={styles.accordionBody}>
                  <label className={styles.toggle}>
                    <span className={styles.toggleText}>
                      <strong>Hide like and view counts</strong>
                      <span className={styles.toggleHint}>Only you will see the total number of likes and views.</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={details.hideLikeCount}
                      onChange={e => setDetail('hideLikeCount', e.target.checked)}
                    />
                  </label>

                  <label className={styles.toggle}>
                    <span className={styles.toggleText}>
                      <strong>Turn off commenting</strong>
                      <span className={styles.toggleHint}>You can change this later from Post Options.</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={details.commentsDisabled}
                      onChange={e => setDetail('commentsDisabled', e.target.checked)}
                    />
                  </label>
                </div>
              </details>

              {error && <p className={styles.error}>{error}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
