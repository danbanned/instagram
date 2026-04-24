import { useState } from 'react';
import styles from './SearchPage.module.css';

const RECENT_SEARCHES = [
  { id: '1', username: 'only1marie__',           name: 'Miah Marie',       following: true  },
  { id: '2', username: 'hugemilkers_',            name: 'Huge Milkers 🐟',  following: false },
  { id: '3', username: 'last_of_us_part2ellie',  name: 'Last Of Us',       following: false },
  { id: '4', username: 'taylornickens',           name: 'Taylor Nickens',   following: true  },
];

export default function SearchPage() {
  const [query,   setQuery]   = useState('');
  const [recent,  setRecent]  = useState(RECENT_SEARCHES);

  const results = query.length > 0
    ? [{ id: 'r1', username: query.toLowerCase().replace(/\s+/g, '_'), name: query, following: false }]
    : [];

  return (
    <main className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 className={styles.title}>Search</h2>
        </div>

        <div className={styles.inputWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.input}
            type="text"
            placeholder="Search"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button className={styles.clearBtn} onClick={() => setQuery('')}>✕</button>
          )}
        </div>

        {query.length === 0 ? (
          <>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Recent</span>
              <button className={styles.clearAllBtn} onClick={() => setRecent([])}>
                Clear all
              </button>
            </div>

            {recent.length === 0 ? (
              <p className={styles.emptyHint}>No recent searches.</p>
            ) : (
              <ul className={styles.list}>
                {recent.map(u => (
                  <li key={u.id} className={styles.userRow}>
                    <div className={styles.avatar} />
                    <div className={styles.userInfo}>
                      <span className={styles.username}>{u.username}</span>
                      <span className={styles.name}>{u.name}</span>
                    </div>
                    <button className={`${styles.followBtn} ${u.following ? styles.following : ''}`}>
                      {u.following ? 'Following' : 'Follow'}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className={styles.messagesPromo}>
              <p className={styles.promoTitle}>Your messages</p>
              <p className={styles.promoSub}>Send a message to start a chat.</p>
              <button className={styles.sendBtn}>Send message</button>
            </div>
          </>
        ) : (
          <ul className={styles.list}>
            {results.map(u => (
              <li key={u.id} className={styles.userRow}>
                <div className={styles.avatar} />
                <div className={styles.userInfo}>
                  <span className={styles.username}>{u.username}</span>
                  <span className={styles.name}>{u.name}</span>
                </div>
                <button className={styles.followBtn}>Follow</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
