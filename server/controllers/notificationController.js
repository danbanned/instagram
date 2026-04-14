const Notification = require('../models/Notification');

async function getNotifications(req, res) {
  const notifications = await Notification.findByRecipient(req.user.id);
  res.json(notifications);
}

async function markRead(req, res) {
  await Notification.markAllRead(req.user.id);
  res.json({ ok: true });
}

module.exports = { getNotifications, markRead };
