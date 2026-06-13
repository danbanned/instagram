import { useState, useEffect } from 'react';
import api from '../../services/api';
import styles from './ForwardModal.module.css';

export default function ForwardModal({ message, onClose, onForward }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await api.get('/messages/conversations');
        setConversations(response.data.conversations);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  const handleForward = (conversationId) => {
    onForward(message.id, conversationId);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Forward message</h3>
          <button onClick={onClose}>✕</button>
        </div>

        <div className={styles.content}>
          {loading ? <p>Loading...</p> : (
            <div className={styles.list}>
              {conversations.map(conv => (
                <div key={conv.id} className={styles.item} onClick={() => handleForward(conv.id)}>
                  <img src={conv.otherUser?.avatarUrl || '/default-avatar.png'} alt="" />
                  <span>{conv.otherUser?.username}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
