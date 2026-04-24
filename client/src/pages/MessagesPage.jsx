import { useState } from 'react';
import styles from './MessagesPage.module.css';

const MOCK_THREADS = [
  { id: '1', name: 'Elizabeth Lauren',                       username: 'dautriche',  last: 'Video chat ended · 12h',                   unread: false, isGroup: false },
  { id: '2', name: 'Lizzy Lauren',                           username: 'lizzy',      last: 'You: Nothing better than talking · 1w',     unread: false, isGroup: false },
  { id: '3', name: 'The Supernovas',                         username: '',           last: 'Zah sent a photo · 2h',                    unread: true,  isGroup: true  },
  { id: '4', name: 'Harry, Elle Sharae, Miah Marie + 1...',  username: '',           last: '4+ new messages · 4h',                     unread: true,  isGroup: true  },
  { id: '5', name: 'Young Josh',                             username: 'youngjosh',  last: 'TURN ON THE REMINDER PLZZ !!! · 11h',       unread: false, isGroup: false },
  { id: '6', name: '@ky',                                    username: 'kaviix',     last: 'You: Happy birthday big sis · 1d',          unread: false, isGroup: false },
];

const MOCK_MESSAGES = {
  '1': [
    { id: 'm1', sent: false, text: 'Hey! How are you?',            time: '12h' },
    { id: 'm2', sent: true,  text: 'I\'m good, thanks for asking!', time: '12h' },
    { id: 'm3', sent: false, text: 'We should catch up soon 😊',   time: '11h' },
  ],
  default: [
    { id: 'm1', sent: false, text: 'Hey!', time: '1d' },
  ],
};

export default function MessagesPage() {
  const [selected, setSelected]   = useState(null);
  const [draft,    setDraft]      = useState('');
  const [messages, setMessages]   = useState(MOCK_MESSAGES);

  const thread  = MOCK_THREADS.find(t => t.id === selected);
  const msgs    = messages[selected] ?? messages['default'];

  const sendMessage = () => {
    if (!draft.trim() || !selected) return;
    const msg = { id: `m${Date.now()}`, sent: true, text: draft.trim(), time: 'now' };
    setMessages(prev => ({ ...prev, [selected]: [...(prev[selected] ?? []), msg] }));
    setDraft('');
  };

  return (
    <main className={styles.page}>
      {/* Thread list */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>Messages</h2>
          <button className={styles.newBtn} title="New message">✏️</button>
        </div>

        <div className={styles.searchWrap}>
          <input className={styles.searchInput} type="text" placeholder="Search" />
        </div>

        <ul className={styles.threadList}>
          {MOCK_THREADS.map(t => (
            <li
              key={t.id}
              className={`${styles.thread} ${selected === t.id ? styles.active : ''}`}
              onClick={() => setSelected(t.id)}
            >
              <div className={`${styles.threadAvatar} ${t.isGroup ? styles.groupAvatar : ''}`} />
              <div className={styles.threadBody}>
                <span className={styles.threadName}>{t.name}</span>
                <span className={`${styles.threadLast} ${t.unread ? styles.unreadText : ''}`}>{t.last}</span>
              </div>
              {t.unread && <span className={styles.unreadDot} />}
            </li>
          ))}
        </ul>
      </div>

      {/* Chat panel */}
      <div className={styles.chat}>
        {thread ? (
          <>
            <div className={styles.chatHeader}>
              <div className={styles.threadAvatar} />
              <div>
                <p className={styles.chatName}>{thread.name}</p>
                {thread.username && <p className={styles.chatUsername}>@{thread.username}</p>}
              </div>
              <button className={styles.chatMenu}>⋯</button>
            </div>

            <div className={styles.chatMessages}>
              {msgs.map(m => (
                <div key={m.id} className={`${styles.bubble} ${m.sent ? styles.sent : styles.received}`}>
                  {m.text}
                </div>
              ))}
            </div>

            <div className={styles.inputRow}>
              <input
                className={styles.msgInput}
                type="text"
                placeholder="Message..."
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
              />
              <button
                className={styles.sendBtn}
                onClick={sendMessage}
                disabled={!draft.trim()}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className={styles.noChat}>
            <span className={styles.noChatIcon}>💬</span>
            <h3 className={styles.noChatTitle}>Your messages</h3>
            <p className={styles.noChatSub}>Send a message to start a chat.</p>
            <button className={styles.startBtn}>Send message</button>
          </div>
        )}
      </div>
    </main>
  );
}
