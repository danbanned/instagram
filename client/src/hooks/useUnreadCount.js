import { useState, useEffect } from 'react';
import { getSocket } from '../services/socket';
import api from '../services/api';

export function useUnreadCount() {
  const [count, setCount] = useState(0);
  const socket = getSocket();

  useEffect(() => {
    const fetchTotalUnread = async () => {
      try {
        const response = await api.get('/messages/conversations');
        const total = response.data.conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);
        setCount(total);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    fetchTotalUnread();

    if (socket) {
      const handleNewMessage = (data) => {
        if (data.message.senderId !== socket.userId) {
          setCount(prev => prev + 1);
        }
      };

      const handleMessagesRead = ({ conversationId }) => {
        // We might need to re-fetch to be accurate or track per-conv
        fetchTotalUnread();
      };

      socket.on('new_message', handleNewMessage);
      socket.on('messages_read', handleMessagesRead);

      return () => {
        socket.off('new_message', handleNewMessage);
        socket.off('messages_read', handleMessagesRead);
      };
    }
  }, [socket]);

  return count;
}
