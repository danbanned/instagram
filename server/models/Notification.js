const prisma = require('../config/prisma');

const NOTIFICATION_INCLUDE = {
  sender: { select: { id: true, username: true, avatarUrl: true } },
  post: { select: { id: true, mediaUrl: true } },
};

function transformNotification(n) {
  return {
    id: n.id,
    type: n.type,
    message: n.message,
    isRead: n.isRead,
    createdAt: n.createdAt,
    sender: { id: n.sender.id, username: n.sender.username, avatarUrl: n.sender.avatarUrl },
    post: n.post ? { id: n.post.id, mediaUrl: n.post.mediaUrl } : null,
  };
}

async function create({ recipientId, senderId, type, postId = null, message }) {
  const notification = await prisma.notification.create({
    data: { recipientId, senderId, type, postId, message },
    include: NOTIFICATION_INCLUDE,
  });
  return transformNotification(notification);
}

async function findByRecipient(userId) {
  const notifications = await prisma.notification.findMany({
    where: { recipientId: userId },
    include: NOTIFICATION_INCLUDE,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return notifications.map(transformNotification);
}

async function markAllRead(userId) {
  await prisma.notification.updateMany({
    where: { recipientId: userId, isRead: false },
    data: { isRead: true },
  });
}

module.exports = { create, findByRecipient, markAllRead };
