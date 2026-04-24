import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { SafeImage, getMediaUrl } from '../utils/media';
import { timeAgo } from '../utils/timeAgo';
import { replyToStory, addReaction, trackView } from '../services/storyService';
import '../styles/StoryViewer.css';

const TICK = 50;
const IMAGE_DURATION = 5000;
const VIDEO_DURATION = 15000;
const REACTIONS = ['❤️', '😂', '😮', '😢', '😡'];

export default function StoryViewer({ stories, onClose, onStorySeen, onNext, onPrevious }) {
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [replySent, setReplySent] = useState(false);
  const [replyFocused, setReplyFocused] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [reactionSent, setReactionSent] = useState(null);
  const [showTapHint, setShowTapHint] = useState(() => !localStorage.getItem('sv_tap_seen'));

  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const pressTimerRef = useRef(null);
  const pointerStartRef = useRef(null);
  const isPressRef = useRef(false);

  // Keep latest callbacks/state in a ref so interval/setTimeout can read current values
  const cbRef = useRef({});
  cbRef.current = { onClose, onNext, onPrevious, onStorySeen, stories, idx, paused, replyFocused };

  // Reset idx to 0 whenever the stories array itself changes (new user's stories loaded)
  useEffect(() => {
    setIdx(0);
  }, [stories]);

  const goNext = useCallback(() => {
    const { stories, idx, onNext, onClose } = cbRef.current;
    if (idx < stories.length - 1) {
      setIdx(i => i + 1);
    } else if (onNext) {
      onNext();
    } else {
      onClose();
    }
  }, []);

  const goPrev = useCallback(() => {
    const { idx, onPrevious } = cbRef.current;
    if (idx > 0) {
      setIdx(i => i - 1);
    } else if (onPrevious) {
      onPrevious();
    }
  }, []);

  const goNextRef = useRef(goNext);
  goNextRef.current = goNext;

  // Body scroll lock — only on mount/unmount so cleanup always uses the original overflow value
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Keyboard navigation — separate effect so showMenu changes don't re-capture prev overflow
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { if (showMenu) setShowMenu(false); else cbRef.current.onClose(); }
      if (e.key === 'ArrowRight') goNextRef.current();
      if (e.key === 'ArrowLeft') goPrev();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showMenu]);

  // Progress timer — elapsed time tracked in closure so goNext is NEVER called inside a state updater
  const story = stories?.[idx];
  useEffect(() => {
    if (!story) return;
    setProgress(0);
    setReplySent(false);
    setReactionSent(null);
    setShowMenu(false);

    if (onStorySeen) onStorySeen(story.id);
    trackView(story.id).catch(() => {});

    const duration = story.mediaType === 'video' ? VIDEO_DURATION : IMAGE_DURATION;
    let elapsed = 0;
    let done = false;

    timerRef.current = setInterval(() => {
      if (cbRef.current.paused || cbRef.current.replyFocused) return;
      elapsed += TICK;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);
      if (pct >= 100 && !done) {
        done = true;
        clearInterval(timerRef.current);
        goNextRef.current(); // called directly from interval, never from inside setProgress
      }
    }, TICK);

    return () => {
      done = true; // cancels any pending goNext if this effect re-runs before interval fires
      clearInterval(timerRef.current);
    };
  }, [idx, story?.id]);

  // Video mute sync
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  // Pointer gesture handlers
  const onPointerDown = (e) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    isPressRef.current = false;
    pressTimerRef.current = setTimeout(() => {
      isPressRef.current = true;
      setPaused(true);
      if (videoRef.current) videoRef.current.pause();
    }, 400);
  };

  const onPointerUp = (e) => {
    clearTimeout(pressTimerRef.current);
    if (isPressRef.current) {
      setPaused(false);
      if (videoRef.current) videoRef.current.play().catch(() => {});
      return;
    }
    const start = pointerStartRef.current;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const elapsed = Date.now() - start.time;
    if (dy > 60 && Math.abs(dx) < 60 && elapsed < 500) { cbRef.current.onClose(); return; }
    if (elapsed < 300 && Math.abs(dx) < 20 && Math.abs(dy) < 20) {
      const rect = e.currentTarget.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width;
      if (relX < 0.35) goPrev(); else goNextRef.current();
    }
  };

  const onPointerLeave = () => {
    clearTimeout(pressTimerRef.current);
    if (isPressRef.current) {
      isPressRef.current = false;
      setPaused(false);
      if (videoRef.current) videoRef.current.play().catch(() => {});
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !story) return;
    try {
      await replyToStory(story.id, replyText);
      setReplyText('');
      setReplySent(true);
      setTimeout(() => setReplySent(false), 2000);
    } catch { /* silent fail */ }
  };

  const handleReaction = async (type) => {
    if (!story) return;
    try {
      await addReaction(story.id, type);
      setReactionSent(type);
      setTimeout(() => setReactionSent(null), 2000);
    } catch { /* silent fail */ }
  };

  const dismissTapHint = () => {
    localStorage.setItem('sv_tap_seen', '1');
    setShowTapHint(false);
  };

  if (!stories?.length || !story) return null;

  const mediaUrl = getMediaUrl ? getMediaUrl(story.mediaUrl) : story.mediaUrl;

  return createPortal(
    <div className="sv-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="sv-container"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
      >
        {/* Progress bars */}
        <div className="sv-progress-row">
          {stories.map((_, i) => (
            <div key={i} className="sv-bar-bg">
              <div
                className="sv-bar-fill"
                style={{ width: `${i === idx ? progress : i < idx ? 100 : 0}%` }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="sv-header" onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
          <div className="sv-user">
            {story.user?.avatarUrl
              ? <SafeImage src={story.user.avatarUrl} className="sv-avatar" alt="" />
              : <div className="sv-avatar sv-avatar-placeholder" />
            }
            <span className="sv-username">{story.user?.username}</span>
            <span className="sv-time">{timeAgo(story.createdAt)}</span>
          </div>
          <div className="sv-header-actions">
            {story.mediaType === 'video' && (
              <button className="sv-icon-btn" onClick={(e) => { e.stopPropagation(); setMuted(m => !m); }} title={muted ? 'Unmute' : 'Mute'}>
                {muted ? '🔇' : '🔊'}
              </button>
            )}
            <button className="sv-icon-btn" onClick={(e) => { e.stopPropagation(); setShowMenu(m => !m); }} title="More options">⋮</button>
            <button className="sv-icon-btn" onClick={(e) => { e.stopPropagation(); onClose(); }} title="Close">✕</button>
          </div>
        </div>

        {/* Three-dot menu */}
        {showMenu && (
          <div
            className="sv-menu-overlay"
            onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
          >
            <div className="sv-menu-card" onClick={(e) => e.stopPropagation()}>
              <button className="sv-menu-item">⚠️ Report inappropriate</button>
              <button className="sv-menu-item">ℹ️ About this account</button>
              <div className="sv-menu-divider" />
              <button className="sv-menu-item sv-menu-item--cancel" onClick={() => setShowMenu(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Media */}
        <div className="sv-media">
          {story.mediaType === 'video' ? (
            <video ref={videoRef} src={mediaUrl} className="sv-media-el" autoPlay muted={muted} playsInline loop={false} />
          ) : (
            <SafeImage src={story.mediaUrl} className="sv-media-el" alt="Story" />
          )}
          {paused && <div className="sv-paused-badge">▐▐</div>}
          {reactionSent && <div className="sv-reaction-toast">{reactionSent}</div>}
        </div>

        {/* Bottom: reactions + reply */}
        <div className="sv-bottom" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
          <div className="sv-reactions-row">
            {REACTIONS.map((emoji) => (
              <button
                key={emoji}
                className={`sv-reaction-btn${reactionSent === emoji ? ' sv-reaction-btn--active' : ''}`}
                onClick={() => handleReaction(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
          {replySent ? (
            <div className="sv-reply-sent">Reply sent ✓</div>
          ) : (
            <div className="sv-reply-row">
              <input
                className="sv-reply-input"
                placeholder="Reply to story..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onFocus={() => setReplyFocused(true)}
                onBlur={() => setReplyFocused(false)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleReply(); }}
              />
              <button className="sv-reply-send" disabled={!replyText.trim()} onClick={handleReply}>Send</button>
            </div>
          )}
        </div>

        {/* First-time tap hint */}
        {showTapHint && (
          <div className="sv-tap-hint" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
            <p>Tap right → next story</p>
            <p>Tap left ← previous story</p>
            <p>Press & hold to pause</p>
            <p>Swipe down to close</p>
            <button onClick={dismissTapHint}>Got it</button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
