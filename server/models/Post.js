const { pool } = require('../config/db');

const FEED_QUERY = `
  SELECT
    p.id, p.caption, p.media_url AS "mediaUrl", p.media_type AS "mediaType",
    p.created_at AS "createdAt", p.updated_at AS "updatedAt",
    p.author_id AS "authorId",
    u.username AS "authorUsername", u.avatar_url AS "authorAvatarUrl",
    COUNT(DISTINCT pl.user_id)::int AS "likesCount",
    COALESCE(
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'id',        c.id,
          'text',      c.text,
          'createdAt', c.created_at,
          'user', JSON_BUILD_OBJECT(
            'id',        cu.id,
            'username',  cu.username,
            'avatarUrl', cu.avatar_url
          )
        ) ORDER BY c.created_at ASC
      ) FILTER (WHERE c.id IS NOT NULL),
      '[]'
    ) AS comments
  FROM posts p
  JOIN users u ON u.id = p.author_id
  LEFT JOIN post_likes pl ON pl.post_id = p.id
  LEFT JOIN comments c ON c.post_id = p.id
  LEFT JOIN users cu ON cu.id = c.user_id
`;

function rowToPost(row) {
  return {
    id: row.id,
    caption: row.caption,
    mediaUrl: row.mediaUrl,
    mediaType: row.mediaType,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    likesCount: row.likesCount,
    comments: row.comments,
    author: {
      id: row.authorId,
      username: row.authorUsername,
      avatarUrl: row.authorAvatarUrl
    }
  };
}

async function create({ authorId, caption, mediaUrl, mediaType }) {
  const { rows } = await pool.query(
    `INSERT INTO posts (author_id, caption, media_url, media_type)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [authorId, caption || '', mediaUrl, mediaType]
  );
  return findById(rows[0].id);
}

async function findById(id) {
  const { rows } = await pool.query(
    FEED_QUERY + ' WHERE p.id = $1 GROUP BY p.id, u.id',
    [id]
  );
  return rows[0] ? rowToPost(rows[0]) : null;
}

async function getFeed() {
  const { rows } = await pool.query(
    FEED_QUERY + ' GROUP BY p.id, u.id ORDER BY p.created_at DESC LIMIT 50'
  );
  return rows.map(rowToPost);
}

async function isLikedBy(postId, userId) {
  const { rows } = await pool.query(
    'SELECT 1 FROM post_likes WHERE post_id = $1 AND user_id = $2',
    [postId, userId]
  );
  return rows.length > 0;
}

async function addLike(postId, userId) {
  await pool.query(
    'INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [postId, userId]
  );
}

async function removeLike(postId, userId) {
  await pool.query(
    'DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2',
    [postId, userId]
  );
}

async function getLikesCount(postId) {
  const { rows } = await pool.query(
    'SELECT COUNT(*)::int AS count FROM post_likes WHERE post_id = $1',
    [postId]
  );
  return rows[0].count;
}

async function addComment(postId, userId, text) {
  const { rows } = await pool.query(
    `INSERT INTO comments (post_id, user_id, text) VALUES ($1, $2, $3) RETURNING *`,
    [postId, userId, text]
  );
  const { rows: userRows } = await pool.query(
    'SELECT id, username, avatar_url FROM users WHERE id = $1',
    [userId]
  );
  const u = userRows[0];
  return {
    id: rows[0].id,
    text: rows[0].text,
    createdAt: rows[0].created_at,
    user: { id: u.id, username: u.username, avatarUrl: u.avatar_url }
  };
}

module.exports = { create, findById, getFeed, isLikedBy, addLike, removeLike, getLikesCount, addComment };
