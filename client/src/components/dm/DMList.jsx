import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSocket } from '../../services/socket';
import api from '../../services/api';
import styles from './DMList.module.css';

export default function DMList() {
  const [conversations, setConversations] = useState([]);
  const socket = getSocket();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await api.get('/messages/conversations');
        setConversations(response.data.conversations);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      }
    };

    fetchConversations();

    if (socket) {
      socket.on('new_message', (data) => {
        setConversations(prev => {
          const idx = prev.findIndex(c => c.id === data.conversationId);
          if (idx === -1) {
            // If it's a new conversation, we might need to fetch it or wait for a refresh
            // For now, let's just refresh if not found
            fetchConversations();
            return prev;
          }
          const updated = [...prev];
          updated[idx].lastMessage = data.message.content;
          updated[idx].unreadCount += 1;
          const moved = updated.splice(idx, 1)[0];
          return [moved, ...updated];
        });
      });
    }

    return () => {
      if (socket) socket.off('new_message');
    };
  }, [socket]);

  return (
    <div className={styles.dmList}>
      <h2 className={styles.title}>Messages</h2>
      <div className={styles.conversations}>
        {conversations.map(conv => (
          <Link key={conv.id} to={`/messages/${conv.id}`} className={styles.conversationLink}>
            <div className={styles.conversationItem}>
              <img 
                src={conv.otherUser?.avatarUrl || '/default-avatar.png'} 
                alt={conv.otherUser?.username} 
                className={styles.avatar}
              />
              <div className={styles.details}>
                <strong className={styles.username}>{conv.otherUser?.username}</strong>
                <p className={styles.lastMessage}>{conv.lastMessage?.substring(0, 40)}</p>
              </div>
              {conv.unreadCount > 0 && <span className={styles.unreadBadge}>{conv.unreadCount}</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
