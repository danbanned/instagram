const Notification = require('../models/Notification');
const { getIO } = require('../config/socket');

async function createNotification({ recipient, sender, type, post, message }) {
  const notification = await Notification.create({ recipient, sender, type, post, message });
  const populated = await notification.populate('sender', 'username avatarUrl');

  try {
    const io = getIO();
    io.to(String(recipient)).emit('notification:new', populated);
  } catch (_) {
    // Socket can be unavailable in tests
  }

  return populated;
}

module.exports = { createNotification };
