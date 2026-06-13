import { useState, useEffect, useRef } from 'react';
import { getSocket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import ForwardModal from './ForwardModal';
import styles from './ChatThread.module.css';

export default function ChatThread({ conversationId, otherUser }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [forwardMessage, setForwardMessage] = useState(null);
  const socket = getSocket();
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        console.log(`ChatThread: Fetching messages for ${conversationId}`);
        const response = await api.get(`/messages/${conversationId}`);
        console.log(`ChatThread: Received ${response.data.messages?.length} messages`);
        setMessages(response.data.messages || []);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };

    if (conversationId) {
      fetchMessages();
    }

    if (socket) {
      console.log('ChatThread: Setting up socket listeners');
      socket.on('new_message', (data) => {
        console.log('ChatThread: new_message received', data);
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
            typingTimeoutRef.current = setTimeout(() => setOtherUserTyping(false), 3000);
          }
        }
      });

      socket.on('message_reaction_updated', ({ messageId, reaction }) => {
        setMessages(prev => prev.map(m => {
          if (m.id !== messageId) return m;
          const reactions = m.reactions || [];
          const idx = reactions.findIndex(r => r.userId === reaction.userId);
          const updatedReactions = idx > -1 
            ? reactions.map((r, i) => i === idx ? reaction : r)
            : [...reactions, reaction];
          return { ...m, reactions: updatedReactions };
        }));
      });

      socket.on('message_updated', ({ message }) => {
        setMessages(prev => prev.map(m => m.id === message.id ? { ...m, ...message } : m));
      });

      socket.on('message_deleted', ({ messageId }) => {
        setMessages(prev => prev.map(m => 
          m.id === messageId ? { ...m, isDeleted: true, content: 'Message deleted' } : m
        ));
      });

      socket.on('poll_updated', ({ pollId, poll }) => {
        setMessages(prev => prev.map(m => 
          m.poll?.id === pollId ? { ...m, poll } : m
        ));
      });
    }

    return () => {
      if (socket) {
        socket.off('new_message');
        socket.off('user_typing');
        socket.off('message_reaction_updated');
        socket.off('message_updated');
        socket.off('message_deleted');
        socket.off('poll_updated');
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [conversationId, otherUser, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (data) => {
    if (!socket) return;
    
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = { 
      id: tempId, 
      senderId: user?.id, 
      createdAt: new Date().toISOString(),
      isPending: true,
      sender: user,
      ...data
    };
    
    setMessages(prev => [...prev, optimisticMessage]);

    socket.emit('send_message', {
      conversationId,
      receiverId: otherUser?.id,
      ...data
    }, (response) => {
      if (response.success) {
        setMessages(prev => prev.map(m => m.id === optimisticMessage.id ? response.message : m));
      } else {
        setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
        alert('Failed to send message: ' + response.error);
      }
    });

    setReplyTo(null);
  };

  const handleTyping = (isTyping) => {
    if (socket) {
      socket.emit('typing', { conversationId, receiverId: otherUser?.id, isTyping });
    }
  };

  const handleReact = (messageId, reaction) => {
    socket?.emit('react_to_message', { messageId, reaction });
  };

  const handleDelete = (messageId) => {
    if (window.confirm('Delete message for everyone?')) {
      socket?.emit('delete_message', { messageId, forEveryone: true });
    }
  };

  const handleVotePoll = (pollOptionId) => {
    socket?.emit('vote_poll', { pollOptionId });
  };

  const handleForward = (messageId, targetConversationId) => {
    socket?.emit('send_message', {
      conversationId: targetConversationId,
      originalMessageId: messageId, // Server can copy the content/media
      forwarded: true
    }, (response) => {
      if (!response.success) alert('Failed to forward message');
    });
  };

  return (
    <div className={styles.chatThread}>
      <div className={styles.chatHeader}>
        <img src={otherUser?.avatarUrl || '/default-avatar.png'} className={styles.headerAvatar} alt="" />
        <div className={styles.headerInfo}>
          <strong className={styles.headerUsername}>{otherUser?.username}</strong>
          <span className={styles.status}>{otherUserTyping ? 'Typing...' : 'Active now'}</span>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.headerAction} title="Voice call">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.6a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 10.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </button>
          <button className={styles.headerAction} title="Video call">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </button>
          <button className={styles.headerAction} title="Info">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </button>
        </div>
      </div>

      <div className={styles.messagesArea}>
        {messages.map(msg => (
          <MessageBubble 
            key={msg.id}
            message={msg}
            isOwn={msg.senderId === user?.id}
            onReply={setReplyTo}
            onReact={handleReact}
            onDelete={handleDelete}
            onVotePoll={handleVotePoll}
            onForward={setForwardMessage}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput 
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />

      {forwardMessage && (
        <ForwardModal 
          message={forwardMessage}
          onClose={() => setForwardMessage(null)}
          onForward={handleForward}
        />
      )}
    </div>
  );
}
