const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

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
        let otherUser = null;
        if (!conv.isGroup) {
          const otherId = conv.participants.find(p => p !== userId);
          otherUser = otherId ? await prisma.user.findUnique({
            where: { id: otherId },
            select: { id: true, username: true, avatarUrl: true }
          }) : null;
        }
        
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            isRead: false
          }
        });

        return {
          ...conv,
          lastMessage: conv.messages[0]?.content,
          otherUser,
          unreadCount
        };
      } catch (innerError) {
        console.error(`Error enriching conversation ${conv.id}:`, innerError);
        return {
          ...conv,
          lastMessage: conv.messages[0]?.content,
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

    let conversation = await prisma.conversation.findFirst({
      where: {
        participants: { hasEvery: [userId, otherUserId] },
        isGroup: false
      }
    });

    if (conversation && conversation.participants.length !== 2 && userId !== otherUserId) {
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

    console.log(`GET /messages/${conversationId}: userId=${userId}`);

    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, participants: { has: userId } }
    });
    
    if (!conversation) {
      console.log('Conversation not found or user not authorized');
      return res.status(403).json({ error: 'Not part of this conversation' });
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        // Using a more explicit query for deletedFor
        OR: [
          { deletedFor: { equals: [] } },
          { NOT: { deletedFor: { has: userId } } }
        ]
      },
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } },
        replyTo: { include: { sender: { select: { username: true } } } },
        reactions: { include: { user: { select: { username: true } } } },
        poll: { include: { options: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`Found ${messages.length} messages for conversation ${conversationId}`);
    res.json({ messages });
  } catch (error) {
    console.error('GET /messages/:conversationId error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /upload - Upload media for DM
router.post('/upload', protect, upload.single('media'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    // If using Cloudinary, req.file.path is the URL
    // If using local storage, we might need to prepend the server URL
    const mediaUrl = req.file.path.startsWith('http') ? req.file.path : `/uploads/${req.file.filename}`;
    
    res.json({ 
      mediaUrl, 
      mediaType: req.file.mimetype.startsWith('image') ? 'image' : 
                 req.file.mimetype.startsWith('video') ? 'video' : 'audio'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /:messageId - Edit message (within 10 min)
router.patch('/:messageId', protect, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) return res.status(404).json({ error: 'Message not found' });
    if (message.senderId !== userId) return res.status(403).json({ error: 'Not authorized' });

    const diff = (new Date().getTime() - new Date(message.createdAt).getTime()) / 60000;
    if (diff > 10) return res.status(400).json({ error: 'Cannot edit message after 10 minutes' });

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { content, isEdited: true },
      include: { sender: { select: { id: true, username: true, avatarUrl: true } } }
    });

    res.json({ message: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
