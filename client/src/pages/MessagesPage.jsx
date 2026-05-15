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
    if (conversationId) {
      // We need to know who the other user is in this conversation
      // We can get this from the conversation details
      const fetchConversationDetails = async () => {
        try {
          // This endpoint could be optimized to just get metadata
          const response = await api.get('/messages/conversations');
          const currentConv = response.data.conversations.find(c => c.id === conversationId);
          if (currentConv) {
            setOtherUser(currentConv.otherUser);
          }
        } catch (error) {
          console.error('Failed to fetch conversation details:', error);
        }
      };
      fetchConversationDetails();
    } else {
      setOtherUser(null);
    }
  }, [conversationId]);

  return (
    <main className={styles.page}>
      <div className={styles.sidebar}>
        <DMList />
      </div>

      <div className={styles.chat}>
        {conversationId ? (
          <ChatThread 
            conversationId={conversationId} 
            otherUser={otherUser} 
          />
        ) : (
          <div className={styles.noChat}>
            <span className={styles.noChatIcon}>💬</span>
            <h3 className={styles.noChatTitle}>Your messages</h3>
            <p className={styles.noChatSub}>Send a message to start a chat.</p>
            <button className={styles.startBtn} onClick={() => {/* handle new message modal? */}}>
              Send message
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
