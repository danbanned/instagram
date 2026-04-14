const { pool } = require('../config/db');

function rowToUser(row, includePassword = false) {
  if (!row) return null;
  const user = {
    id: row.id,
    username: row.username,
    email: row.email,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (includePassword) user.password = row.password;
  return user;
}

async function findById(id) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  return rowToUser(rows[0]);
}

async function findOne({ email, username } = {}) {
  let query, params;
  if (email && username) {
    query = 'SELECT * FROM users WHERE email = $1 OR username = $2 LIMIT 1';
    params = [email, username];
  } else if (email) {
    query = 'SELECT * FROM users WHERE email = $1 LIMIT 1';
    params = [email];
  } else if (username) {
    query = 'SELECT * FROM users WHERE username = $1 LIMIT 1';
    params = [username];
  } else {
    return null;
  }
  const { rows } = await pool.query(query, params);
  return rowToUser(rows[0], true);
}

async function create({ username, email, password, bio = '', avatarUrl = '' }) {
  const { rows } = await pool.query(
    `INSERT INTO users (username, email, password, bio, avatar_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [username.toLowerCase(), email.toLowerCase(), password, bio, avatarUrl]
  );
  return rowToUser(rows[0]);
}

async function isFollowing(followerId, followingId) {
  const { rows } = await pool.query(
    'SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2',
    [followerId, followingId]
  );
  return rows.length > 0;
}

async function follow(followerId, followingId) {
  await pool.query(
    'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [followerId, followingId]
  );
}

async function unfollow(followerId, followingId) {
  await pool.query(
    'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
    [followerId, followingId]
  );
}

module.exports = { findById, findOne, create, isFollowing, follow, unfollow };
