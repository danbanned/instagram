import { useState, useEffect, useRef } from 'react';
import { getSocket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import styles from './ChatThread.module.css';

export default function ChatThread({ conversationId, otherUser }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const socket = getSocket();
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await api.get(`/messages/${conversationId}`);
        setMessages(response.data.messages);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };

    if (conversationId) {
      fetchMessages();
    }

    if (socket) {
      socket.on('new_message', (data) => {
        if (data.conversationId === conversationId) {
          setMessages(prev => [...prev, data.message]);
          socket.emit('mark_read', { conversationId, messageIds: [data.message.id] });
        }
      });

      socket.on('user_typing', (data) => {
        if (data.conversationId === conversationId && data.userId === otherUser?.id) {
          setOtherUserTyping(data.isTyping);
          
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          
          if (data.isTyping) {
            typingTimeoutRef.current = setTimeout(() => {
              setOtherUserTyping(false);
            }, 3000);
          }
        }
      });

      socket.on('message_deleted', ({ messageId }) => {
        setMessages(prev => prev.map(m => 
          m.id === messageId ? { ...m, isDeleted: true, content: 'Message deleted' } : m
        ));
      });
    }

    return () => {
      if (socket) {
        socket.off('new_message');
        socket.off('user_typing');
        socket.off('message_deleted');
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [conversationId, otherUser, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return;
    
    const tempId = `temp-${Date.now()}`;
    // Local optimistic update
    setMessages(prev => [...prev, { 
      id: tempId, 
      content: newMessage, 
      senderId: user?.id, 
      createdAt: new Date().toISOString(),
      isPending: true 
    }]);

    socket.emit('send_message', {
      conversationId,
      receiverId: otherUser?.id,
      content: newMessage
    }, (response) => {
      if (response.success) {
        setMessages(prev => prev.map(m => m.id === tempId ? response.message : m));
      } else {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        alert('Failed to send message: ' + response.error);
      }
    });

    setNewMessage('');
    socket.emit('typing', { conversationId, receiverId: otherUser?.id, isTyping: false });
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (socket) {
      socket.emit('typing', { 
        conversationId, 
        receiverId: otherUser?.id, 
        isTyping: e.target.value.length > 0 
      });
    }
  };

  return (
    <div className={styles.chatThread}>
      <div className={styles.chatHeader}>
        <img src={otherUser?.avatarUrl || '/default-avatar.png'} className={styles.headerAvatar} alt="" />
        <div className={styles.headerInfo}>
          <strong className={styles.headerUsername}>{otherUser?.username}</strong>
          <span className={styles.status}>{otherUserTyping ? 'Typing...' : 'Active now'}</span>
        </div>
      </div>

      <div className={styles.messagesArea}>
        {messages.map(msg => (
          <div key={msg.id} className={`${styles.message} ${msg.senderId === user?.id ? styles.sent : styles.received}`}>
            <div className={styles.messageBubble}>
              <div className={styles.content}>{msg.content}</div>
              <div className={styles.time}>
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputArea}>
        <input 
          className={styles.messageInput}
          value={newMessage} 
          onChange={handleTyping} 
          onKeyPress={e => e.key === 'Enter' && sendMessage()} 
          placeholder="Message..." 
        />
        <button 
          className={styles.sendButton}
          onClick={sendMessage} 
          disabled={!newMessage.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
