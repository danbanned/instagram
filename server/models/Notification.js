const { pool } = require('../config/db');

function rowToNotification(row) {
  return {
    id: row.id,
    type: row.type,
    message: row.message,
    isRead: row.is_read,
    createdAt: row.created_at,
    sender: {
      id: row.sender_id,
      username: row.sender_username,
      avatarUrl: row.sender_avatar_url
    },
    post: row.post_id ? { id: row.post_id, mediaUrl: row.post_media_url } : null
  };
}

async function create({ recipientId, senderId, type, postId = null, message }) {
  const { rows } = await pool.query(
    `INSERT INTO notifications (recipient_id, sender_id, type, post_id, message)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [recipientId, senderId, type, postId, message]
  );

  const { rows: populated } = await pool.query(
    `SELECT n.*,
       u.username AS sender_username, u.avatar_url AS sender_avatar_url,
       p.media_url AS post_media_url
     FROM notifications n
     JOIN users u ON u.id = n.sender_id
     LEFT JOIN posts p ON p.id = n.post_id
     WHERE n.id = $1`,
    [rows[0].id]
  );
  return rowToNotification(populated[0]);
}

async function findByRecipient(userId) {
  const { rows } = await pool.query(
    `SELECT n.*,
       u.username AS sender_username, u.avatar_url AS sender_avatar_url,
       p.media_url AS post_media_url
     FROM notifications n
     JOIN users u ON u.id = n.sender_id
     LEFT JOIN posts p ON p.id = n.post_id
     WHERE n.recipient_id = $1
     ORDER BY n.created_at DESC
     LIMIT 100`,
    [userId]
  );
  return rows.map(rowToNotification);
}

async function markAllRead(userId) {
  await pool.query(
    'UPDATE notifications SET is_read = true WHERE recipient_id = $1 AND is_read = false',
    [userId]
  );
}

module.exports = { create, findByRecipient, markAllRead };
