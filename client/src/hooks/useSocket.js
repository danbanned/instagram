import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export default function useSocket(userId, onNotification) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;
    socket.emit('join', userId);

    socket.on('notification:new', (payload) => {
      if (onNotification) onNotification(payload);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, onNotification]);

  return socketRef;
}
