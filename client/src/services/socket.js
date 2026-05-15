import { io } from 'socket.io-client';

let socket = null;

export const initSocket = (token) => {
  if (socket) socket.disconnect();
  
  const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
  
  socket = io(socketUrl, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true
  });
  
  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) { 
    socket.disconnect(); 
    socket = null; 
  }
};
