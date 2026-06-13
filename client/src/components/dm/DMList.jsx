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
            fetchConversations();
            return prev;
          }
          const updated = [...prev];
          const conv = { ...updated[idx] };
          conv.lastMessage = data.message.content || 'Media';
          conv.lastMessageAt = data.message.createdAt;
          if (data.message.senderId !== socket.userId) {
            conv.unreadCount = (conv.unreadCount || 0) + 1;
          }
          updated.splice(idx, 1);
          return [conv, ...updated];
        });
      });

      socket.on('messages_read', ({ conversationId }) => {
        setConversations(prev => prev.map(c => 
          c.id === conversationId ? { ...c, unreadCount: 0 } : c
        ));
      });
    }

    return () => {
      if (socket) {
        socket.off('new_message');
        socket.off('messages_read');
      }
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
