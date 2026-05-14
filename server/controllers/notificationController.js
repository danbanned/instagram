const prisma = require('../config/prisma');

function normalizeType(type) {
  if (type === 'like') return 'like_post';
  if (type === 'story_reaction') return 'story_like';
  return type;
}

function formatNotification(notification) {
  return {
    id: notification.id,
    type: normalizeType(notification.type),
    message: notification.message,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
    sender: notification.sender
      ? {
          id: notification.sender.id,
          username: notification.sender.username,
          avatar: notification.sender.avatarUrl
        }
      : null,
    post: notification.post
      ? {
          id: notification.post.id,
          mediaUrl: notification.post.mediaUrl
        }
      : null,
    actors: notification.actors || []
  };
}

async function getNotifications(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 50);
    const type = String(req.query.type || 'all');
    const userId = req.user.id;

    const where = { recipientId: userId };
    if (type === 'comments') {
      where.type = { in: ['comment', 'mention'] };
    }

    const rows = await prisma.notification.findMany({
      where,
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } },
        post: { select: { id: true, mediaUrl: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit + 1
    });

    const notifications = rows.slice(0, limit).map((notification) => formatNotification(notification));

    res.json({
      success: true,
      notifications,
      hasMore: rows.length > limit
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
}

async function markRead(req, res) {
  try {
    const { id } = req.params;

    await prisma.notification.updateMany({
      where: {
        id,
        recipientId: req.user.id
      },
      data: { isRead: true }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
}

async function markAllRead(req, res) {
  try {
    await prisma.notification.updateMany({
      where: { recipientId: req.user.id, isRead: false },
      data: { isRead: true }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
}

async function getUnreadCount(req, res) {
  try {
    const count = await prisma.notification.count({
      where: { recipientId: req.user.id, isRead: false }
    });

    res.json({ success: true, count });
  } catch (error) {
    console.error('Get unread notification count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
}

module.exports = { getNotifications, markRead, markAllRead, getUnreadCount };
