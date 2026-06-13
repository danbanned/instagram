const { Server } = require('socket.io');
const prisma = require('./prisma');
const jwt = require('jsonwebtoken');

// In‑memory store for active users
const connectedUsers = new Map(); // userId -> socketId

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: { 
      origin: process.env.CLIENT_URL || 'http://localhost:5173', 
      credentials: true 
    },
    transports: ['websocket', 'polling']
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId; // Match generateToken payload
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`User connected to socket: ${userId}`);
    connectedUsers.set(userId, socket.id);
    socket.join(`user:${userId}`);

    // ---------- Send message ----------
    socket.on('send_message', async (data, callback) => {
      try {
        let { conversationId, receiverId, content, replyToId } = data;
        console.log(`Socket: send_message from ${userId} to ${receiverId} in conv ${conversationId}`);

        if (!conversationId) {
          console.log('No conversationId provided, finding or creating 1:1');
          // Find or create 1:1 conversation
          const existing = await prisma.conversation.findFirst({
            where: {
              participants: { hasEvery: [userId, receiverId] },
              isGroup: false
            }
          });
          if (existing) {
            conversationId = existing.id;
          } else {
            const newConv = await prisma.conversation.create({
              data: { participants: [userId, receiverId], lastMessageAt: new Date() }
            });
            conversationId = newConv.id;
          }
        }

        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: userId,
            content,
            replyToId
          },
          include: {
            sender: { select: { id: true, username: true, avatarUrl: true } },
            replyTo: { include: { sender: { select: { username: true } } } }
          }
        });

        await prisma.conversation.update({
          where: { id: conversationId },
          data: { lastMessage: content, lastMessageAt: new Date(), updatedAt: new Date() }
        });

        // Send to receiver if online
        const receiverSocketId = connectedUsers.get(receiverId);
        if (receiverSocketId) {
          console.log(`Forwarding message to receiver socket: ${receiverSocketId}`);
          io.to(receiverSocketId).emit('new_message', { conversationId, message });
        }

        // ---------- Auto-reply for fake/example accounts ----------
        const receiver = await prisma.user.findUnique({
          where: { id: receiverId },
          select: { isFake: true, username: true }
        });

        if (receiver?.isFake || receiver?.username.includes('@example')) {
          setTimeout(async () => {
            try {
              const autoReplyContent = `Thanks for your message! This is an automated response from ${receiver.username}. (Demo account)`;
              
              const autoMessage = await prisma.message.create({
                data: {
                  conversationId,
                  senderId: receiverId,
                  content: autoReplyContent,
                  replyToId: message.id
                },
                include: {
                  sender: { select: { id: true, username: true, avatarUrl: true } }
                }
              });

              await prisma.conversation.update({
                where: { id: conversationId },
                data: { lastMessage: autoReplyContent, lastMessageAt: new Date(), updatedAt: new Date() }
              });

              // Send auto-reply to original sender
              const senderSocketId = connectedUsers.get(userId);
              if (senderSocketId) {
                io.to(senderSocketId).emit('new_message', { conversationId, message: autoMessage });
              }
            } catch (autoErr) {
              console.error('Auto-reply failed:', autoErr);
            }
          }, 1000);
        }

        // Confirm to sender
        callback({ success: true, message, conversationId });
      } catch (error) {
        callback({ success: false, error: error.message });
      }
    });

    // ---------- Mark messages as read ----------
    socket.on('mark_read', async ({ conversationId, messageIds }) => {
      try {
        console.log(`Socket: mark_read for user ${userId} in conv ${conversationId}`);
        // Find messages in this conversation where the sender is NOT the current user
        await prisma.message.updateMany({
          where: {
            id: { in: messageIds },
            conversationId,
            senderId: { not: userId },
            isRead: false
          },
          data: { isRead: true, readAt: new Date() }
        });

        // Notify the other participant(s)
        const conv = await prisma.conversation.findUnique({
          where: { id: conversationId },
          select: { participants: true }
        });
        if (conv) {
          const others = conv.participants.filter(p => p !== userId);
          for (const pid of others) {
            const pSocket = connectedUsers.get(pid);
            if (pSocket) {
              io.to(pSocket).emit('messages_read', { conversationId, messageIds, readBy: userId });
            }
          }
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // ---------- React to message ----------
    socket.on('react_to_message', async ({ messageId, reaction }) => {
      try {
        console.log(`Socket: react_to_message ${reaction} by ${userId} on ${messageId}`);
        const updatedReaction = await prisma.messageReaction.upsert({
          where: { messageId_userId: { messageId, userId } },
          update: { reaction },
          create: { messageId, userId, reaction },
          include: { user: { select: { username: true } } }
        });

        const message = await prisma.message.findUnique({
          where: { id: messageId },
          select: { conversationId: true }
        });

        if (message) {
          io.to(`user:${userId}`).emit('message_reaction_updated', { messageId, reaction: updatedReaction });
          // Notify others
          const conv = await prisma.conversation.findUnique({
            where: { id: message.conversationId },
            select: { participants: true }
          });
          const others = conv.participants.filter(p => p !== userId);
          for (const pid of others) {
            const pSocket = connectedUsers.get(pid);
            if (pSocket) {
              io.to(pSocket).emit('message_reaction_updated', { messageId, reaction: updatedReaction });
            }
          }
        }
      } catch (error) {
        console.error('Error reacting to message:', error);
      }
    });

    // ---------- Edit message ----------
    socket.on('edit_message', async ({ messageId, content }) => {
      try {
        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (!message || message.senderId !== userId) return;

        const diff = (new Date().getTime() - new Date(message.createdAt).getTime()) / 60000;
        if (diff > 10) return;

        const updated = await prisma.message.update({
          where: { id: messageId },
          data: { content, isEdited: true },
          include: { 
            sender: { select: { id: true, username: true, avatarUrl: true } },
            conversation: { select: { participants: true } }
          }
        });

        // Broadcast update
        for (const pid of updated.conversation.participants) {
          const pSocket = connectedUsers.get(pid);
          if (pSocket) {
            io.to(pSocket).emit('message_updated', { message: updated });
          }
        }
      } catch (error) {
        console.error('Error editing message:', error);
      }
    });

    // ---------- Create Poll ----------
    socket.on('create_poll', async ({ conversationId, receiverId, question, options }) => {
      try {
        // Create base message first
        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: userId,
            content: `Poll: ${question}`
          }
        });

        const poll = await prisma.poll.create({
          data: {
            messageId: message.id,
            question,
            options: {
              create: options.map(opt => ({ text: opt }))
            }
          },
          include: { options: true }
        });

        const fullMessage = await prisma.message.findUnique({
          where: { id: message.id },
          include: {
            sender: { select: { id: true, username: true, avatarUrl: true } },
            poll: { include: { options: true } }
          }
        });

        // Notify
        const conv = await prisma.conversation.findUnique({
          where: { id: conversationId },
          select: { participants: true }
        });
        for (const pid of conv.participants) {
          const pSocket = connectedUsers.get(pid);
          if (pSocket) {
            io.to(pSocket).emit('new_message', { conversationId, message: fullMessage });
          }
        }
      } catch (error) {
        console.error('Error creating poll:', error);
      }
    });

    // ---------- Vote Poll ----------
    socket.on('vote_poll', async ({ pollOptionId }) => {
      try {
        const option = await prisma.pollOption.findUnique({
          where: { id: pollOptionId },
          include: { poll: { include: { message: { select: { conversationId: true } } } } }
        });
        if (!option) return;

        let newVoters = option.voters;
        if (newVoters.includes(userId)) {
          newVoters = newVoters.filter(v => v !== userId);
        } else {
          newVoters.push(userId);
        }

        const updatedOption = await prisma.pollOption.update({
          where: { id: pollOptionId },
          data: { voters: newVoters }
        });

        const poll = await prisma.poll.findUnique({
          where: { id: option.pollId },
          include: { options: true }
        });

        // Broadcast
        const conv = await prisma.conversation.findUnique({
          where: { id: option.poll.message.conversationId },
          select: { participants: true }
        });
        for (const pid of conv.participants) {
          const pSocket = connectedUsers.get(pid);
          if (pSocket) {
            io.to(pSocket).emit('poll_updated', { pollId: option.pollId, poll });
          }
        }
      } catch (error) {
        console.error('Error voting in poll:', error);
      }
    });

    // ---------- Typing indicator ----------
    socket.on('typing', ({ conversationId, receiverId, isTyping }) => {
      const receiverSocket = connectedUsers.get(receiverId);
      if (receiverSocket) {
        io.to(receiverSocket).emit('user_typing', { conversationId, userId, isTyping });
      }
    });

    // ---------- Delete message ----------
    socket.on('delete_message', async ({ messageId, forEveryone }) => {
      try {
        const message = await prisma.message.findUnique({
          where: { id: messageId },
          include: { conversation: true }
        });
        if (!message) return;

        if (forEveryone && message.senderId === userId) {
          await prisma.message.update({
            where: { id: messageId },
            data: { isDeleted: true, content: 'Message deleted' }
          });
        } else if (!forEveryone) {
          await prisma.message.update({
            where: { id: messageId },
            data: { deletedFor: { push: userId } }
          });
        }

        // Notify others in conversation
        const others = message.conversation.participants.filter(pid => pid !== userId);
        for (const pid of others) {
          const pSocket = connectedUsers.get(pid);
          if (pSocket) {
            io.to(pSocket).emit('message_deleted', { messageId, forEveryone });
          }
        }
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    });

    socket.on('disconnect', () => {
      connectedUsers.delete(userId);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

module.exports = { initSocket, getIO };
