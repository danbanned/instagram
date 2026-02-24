const Notification = require('../models/Notification');

async function getNotifications(req, res) {
  const notifications = await Notification.find({ recipient: req.user._id })
    .populate('sender', 'username avatarUrl')
    .populate('post', 'mediaUrl')
    .sort({ createdAt: -1 })
    .limit(100);

  res.json(notifications);
}

async function markRead(req, res) {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { $set: { isRead: true } });
  res.json({ ok: true });
}

module.exports = { getNotifications, markRead };
