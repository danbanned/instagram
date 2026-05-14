const prisma = require('../config/prisma');

async function getHashtag(req, res) {
  try {
    const name = String(req.params.name || '').replace(/^#/, '').toLowerCase();

    const hashtag = await prisma.hashtag.findUnique({
      where: { name },
      include: {
        posts: {
          include: {
            post: {
              include: {
                author: { select: { id: true, username: true, avatarUrl: true } },
                _count: { select: { likes: true, comments: true } }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    });

    if (!hashtag) {
      return res.status(404).json({ error: 'Hashtag not found' });
    }

    res.json({
      success: true,
      hashtag: {
        name: hashtag.name,
        postCount: hashtag.posts.length
      },
      posts: hashtag.posts.map((entry) => ({
        id: entry.post.id,
        mediaUrl: entry.post.mediaUrl,
        mediaType: entry.post.mediaType,
        caption: entry.post.caption,
        location: entry.post.location,
        author: entry.post.author,
        likesCount: entry.post._count.likes,
        commentsCount: entry.post._count.comments,
        createdAt: entry.post.createdAt
      }))
    });
  } catch (error) {
    console.error('Hashtag error:', error);
    res.status(500).json({ error: 'Failed to get hashtag' });
  }
}

async function getHashtagPosts(req, res) {
  try {
    const name = String(req.params.name || '').replace(/^#/, '').toLowerCase();

    const hashtag = await prisma.hashtag.findUnique({
      where: { name },
      include: {
        posts: {
          include: {
            post: {
              include: {
                author: { select: { id: true, username: true, avatarUrl: true } },
                _count: { select: { likes: true, comments: true } }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!hashtag) {
      return res.json({ success: true, hashtag: null, posts: [] });
    }

    return res.json({
      success: true,
      hashtag: {
        name: hashtag.name,
        postCount: hashtag.posts.length
      },
      posts: hashtag.posts.map((entry) => ({
        id: entry.post.id,
        mediaUrl: entry.post.mediaUrl,
        mediaType: entry.post.mediaType,
        caption: entry.post.caption,
        likesCount: entry.post._count.likes,
        commentsCount: entry.post._count.comments,
        author: entry.post.author
      }))
    });
  } catch (error) {
    console.error('Hashtag posts error:', error);
    return res.status(500).json({ error: 'Failed to fetch posts' });
  }
}

module.exports = { getHashtag, getHashtagPosts };
