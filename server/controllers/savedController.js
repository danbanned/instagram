const prisma = require('../config/prisma');
const Post = require('../models/Post');

async function getSavedPosts(req, res) {
  try {
    const savedPosts = await prisma.savedPost.findMany({
      where: { userId: req.user.id },
      include: {
        post: {
          include: {
            author: { select: { id: true, username: true, avatarUrl: true } },
            _count: { select: { likes: true, comments: true } }
          }
        }
      },
      orderBy: { savedAt: 'desc' }
    });

    res.json({
      success: true,
      saved: savedPosts.map((saved) => ({
        id: saved.post.id,
        mediaUrl: saved.post.mediaUrl,
        mediaType: saved.post.mediaType,
        caption: saved.post.caption,
        location: saved.post.location,
        author: saved.post.author,
        likesCount: saved.post._count.likes,
        commentsCount: saved.post._count.comments,
        savedAt: saved.savedAt
      }))
    });
  } catch (error) {
    console.error('Get saved error:', error);
    res.status(500).json({ error: 'Failed to get saved posts' });
  }
}

async function toggleSavedPost(req, res) {
  try {
    const { postId } = req.body || {};
    if (!postId) {
      return res.status(400).json({ error: 'postId is required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const existing = await prisma.savedPost.findUnique({
      where: { userId_postId: { userId: req.user.id, postId } }
    });

    if (existing) {
      await prisma.savedPost.delete({ where: { userId_postId: { userId: req.user.id, postId } } });
      return res.json({ success: true, saved: false });
    }

    await prisma.savedPost.create({
      data: { userId: req.user.id, postId }
    });

    res.json({ success: true, saved: true });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ error: 'Failed to save post' });
  }
}

module.exports = {
  getSavedPosts,
  toggleSavedPost
};
