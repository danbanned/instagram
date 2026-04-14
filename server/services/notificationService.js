const Notification = require('../models/Notification');
const { getIO } = require('../config/socket');

async function createNotification({ recipientId, senderId, type, postId = null, message }) {
  const notification = await Notification.create({ recipientId, senderId, type, postId, message });

  try {
    const io = getIO();
    io.to(String(recipientId)).emit('notification:new', notification);
  } catch (_) {
    // Socket can be unavailable in tests
  }

  return notification;
}

module.exports = { createNotification };
