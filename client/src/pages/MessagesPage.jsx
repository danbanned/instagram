import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './MessagesPage.module.css';
import DMList from '../components/dm/DMList';
import ChatThread from '../components/dm/ChatThread';
import api from '../services/api';

export default function MessagesPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [otherUser, setOtherUser] = useState(null);

  useEffect(() => {
    if (!conversationId) { setOtherUser(null); return; }

    const fetchDetails = async () => {
      try {
        const res = await api.get('/messages/conversations');
        const conv = res.data.conversations.find(c => c.id === conversationId);
        if (conv) setOtherUser(conv.otherUser);
      } catch (e) {
        console.error('Failed to fetch conversation details:', e);
      }
    };
    fetchDetails();
  }, [conversationId]);

  return (
    <main className={styles.page}>
      <div className={styles.sidebar}>
        <DMList activeConversationId={conversationId} />
      </div>

      <div className={styles.chat}>
        {conversationId ? (
          <ChatThread conversationId={conversationId} otherUser={otherUser} />
        ) : (
          <div className={styles.noChat}>
            <div className={styles.noChatIconWrap}>
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className={styles.noChatTitle}>Your messages</h3>
            <p className={styles.noChatSub}>Send a message to start a chat.</p>
          </div>
        )}
      </div>
    </main>
  );
}
