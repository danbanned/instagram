import { useState, useRef } from 'react';
import styles from './ReelsPage.module.css';

const MOCK_REELS = [
  { id: '1', user: 'robbingan_',  caption: 'ts one is called "in china", hear me out 😂',   likes: '12.6K', comments: '843', cover: 'https://picsum.photos/seed/reel1/400/700' },
  { id: '2', user: 'comiczenpa',  caption: 'I\'m in a couple couple of math classes rn 😭',  likes: '8.2K',  comments: '312', cover: 'https://picsum.photos/seed/reel2/400/700' },
  { id: '3', user: 'creativekid', caption: 'POV: you finally fixed the bug at 2am 🤓',       likes: '21K',   comments: '1.1K', cover: 'https://picsum.photos/seed/reel3/400/700' },
  { id: '4', user: 'dailydose',   caption: 'Street food in Tokyo hits different 🍜',          likes: '45.3K', comments: '2.4K', cover: 'https://picsum.photos/seed/reel4/400/700' },
];

export default function ReelsPage() {
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState({});

  return (
    <main className={styles.page}>
      <div className={styles.feed}>
        {MOCK_REELS.map(reel => (
          <div key={reel.id} className={styles.reel}>
            <img src={reel.cover} alt="" className={styles.cover} />

            <div className={styles.overlay}>
              <div className={styles.info}>
                <div className={styles.userRow}>
                  <div className={styles.avatar} />
                  <span className={styles.username}>{reel.user}</span>
                  <button className={styles.followBtn}>Follow</button>
                </div>
                <p className={styles.caption}>{reel.caption}</p>
                <div className={styles.audioRow}>
                  🎵 Original audio · {reel.user}
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  className={`${styles.actionBtn} ${liked[reel.id] ? styles.liked : ''}`}
                  onClick={() => setLiked(p => ({ ...p, [reel.id]: !p[reel.id] }))}
                >
                  {liked[reel.id] ? '❤️' : '🤍'}
                  <span>{reel.likes}</span>
                </button>
                <button className={styles.actionBtn}>
                  💬<span>{reel.comments}</span>
                </button>
                <button className={styles.actionBtn}>
                  📤<span>Share</span>
                </button>
                <button className={styles.actionBtn}>
                  ⋯
                </button>
                <button className={styles.muteBtn} onClick={() => setMuted(m => !m)}>
                  {muted ? '🔇' : '🔊'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
