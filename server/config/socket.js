let io;
const onlineUsers = new Map();

function initSocket(server) {
  io = require('socket.io')(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    socket.on('join', (userId) => {
      if (!userId) return;
      onlineUsers.set(userId, socket.id);
      socket.join(userId);
    });

    socket.on('disconnect', () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

module.exports = { initSocket, getIO };
