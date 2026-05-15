const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { protect } = require('../middleware/authMiddleware');

// Get all conversations for the logged‑in user
router.get('/conversations', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Fetching conversations for user: ${userId}`);
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
      try {
        const otherId = conv.participants.find(p => p !== userId);
        const otherUser = otherId ? await prisma.user.findUnique({
          where: { id: otherId },
          select: { id: true, username: true, avatarUrl: true }
        }) : null;
        
        let unreadCount = 0;
        if (otherId) {
          unreadCount = await prisma.message.count({
            where: {
              conversationId: conv.id,
              senderId: otherId,
              isRead: false
            }
          });
        }

        return {
          id: conv.id,
          lastMessage: conv.messages[0]?.content,
          lastMessageAt: conv.lastMessageAt,
          otherUser,
          unreadCount
        };
      } catch (innerError) {
        console.error(`Error enriching conversation ${conv.id}:`, innerError);
        return {
          id: conv.id,
          lastMessage: conv.messages[0]?.content,
          lastMessageAt: conv.lastMessageAt,
          otherUser: null,
          unreadCount: 0
        };
      }
    }));

    res.json({ conversations: enriched });
  } catch (error) {
    console.error('GET /conversations error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /conversations - get or create 1:1 conversation
router.post('/conversations', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { otherUserId } = req.body;
    
    console.log(`POST /conversations: userId=${userId}, otherUserId=${otherUserId}`);

    if (!otherUserId) {
      return res.status(400).json({ error: 'otherUserId required' });
    }

    // Ensure we don't create a conversation with ourselves unless explicitly intended
    // but the query hasEvery: [userId, otherUserId] might match any conv with userId if userId === otherUserId
    let conversation = await prisma.conversation.findFirst({
      where: {
        participants: { hasEvery: [userId, otherUserId] },
        isGroup: false
      }
    });

    // If searching for 1:1, ensure exactly those two
    if (conversation && conversation.participants.length !== 2 && userId !== otherUserId) {
      // If we found a group or something else, it's not our 1:1
      conversation = null; 
    }

    if (!conversation) {
      console.log('Creating new conversation');
      conversation = await prisma.conversation.create({
        data: { 
          participants: userId === otherUserId ? [userId] : [userId, otherUserId], 
          lastMessageAt: new Date() 
        }
      });
    }

    res.json({ conversationId: conversation.id });
  } catch (error) {
    console.error('POST /conversations error:', error);
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
