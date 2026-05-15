const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { protect } = require('../middleware/authMiddleware');

// Get all conversations for the logged‑in user
router.get('/conversations', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await prisma.conversation.findMany({
      where: { participants: { has: userId } },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Fetch other user details for 1:1 chats
    const enriched = await Promise.all(conversations.map(async (conv) => {
      const otherId = conv.participants.find(p => p !== userId);
      const otherUser = otherId ? await prisma.user.findUnique({
        where: { id: otherId },
        select: { id: true, username: true, avatarUrl: true }
      }) : null;
      
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conv.id,
          senderId: otherId,
          isRead: false
        }
      });

      return {
        id: conv.id,
        lastMessage: conv.messages[0]?.content,
        lastMessageAt: conv.lastMessageAt,
        otherUser,
        unreadCount
      };
    }));

    res.json({ conversations: enriched });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /conversations - get or create 1:1 conversation
router.post('/conversations', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { otherUserId } = req.body;
    
    if (!otherUserId) {
      return res.status(400).json({ error: 'otherUserId required' });
    }

    let conversation = await prisma.conversation.findFirst({
      where: {
        participants: { hasEvery: [userId, otherUserId] },
        isGroup: false
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { 
          participants: [userId, otherUserId], 
          lastMessageAt: new Date() 
        }
      });
    }

    res.json({ conversationId: conversation.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all messages in a conversation
router.get('/:conversationId', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, participants: { has: userId } }
    });
    
    if (!conversation) {
      return res.status(403).json({ error: 'Not part of this conversation' });
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        deletedFor: { not: { has: userId } }
      },
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
