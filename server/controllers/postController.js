const Post = require('../models/Post');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { createNotification } = require('../services/notificationService');
const cache = require('../services/cacheService');
const { toPublicMediaPath, getMediaType } = require('../services/storageService');

async function createPost(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    if (!req.file) return res.status(400).json({ message: 'Media file is required' });

    console.log('Creating post for user:', req.user.id);
    console.log('File received:', req.file.filename, req.file.mimetype);

    const post = await Post.create({
      authorId:         req.user.id,
      caption:          req.body.caption          || '',
      mediaUrl:         toPublicMediaPath(req.file),
      mediaType:        getMediaType(req.file.mimetype),
      location:         req.body.location         || null,
      altText:          req.body.altText          || null,
      hideLikeCount:    req.body.hideLikeCount    === 'true',
      commentsDisabled: req.body.commentsDisabled === 'true',
    });

    console.log('Post created successfully:', post.id);

    cache.del(`feed:${req.user.id}`);
    res.status(201).json(post);
  } catch (err) {
    console.error('Error in createPost controller:', err);
    res.status(500).json({ 
      message: 'Internal server error during post creation', 
      error: err.message 
    });
  }
}

async function getFeed(req, res) {
  const userId = req.user.id;
  const cursor = req.query.cursor || null;
  const limit = Math.min(parseInt(req.query.limit) || 10, 20);

  // Only use cache for the first page (no cursor)
  if (!cursor) {
    const cacheKey = `feed:${userId}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const result = await Post.getFeed(userId, { limit });
    cache.set(cacheKey, result);
    return res.json(result);
  }

  const result = await Post.getFeed(userId, { cursor, limit });
  res.json(result);
}

async function toggleLike(req, res) {
  const post = await Post.findById(req.params.postId);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  const userId = req.user.id;
  const alreadyLiked = await Post.isLikedBy(post.id, userId);

  if (alreadyLiked) {
    await Post.removeLike(post.id, userId);
  } else {
    await Post.addLike(post.id, userId);

    if (post.author.id !== userId) {
      await createNotification({
        recipientId: post.author.id,
        senderId: userId,
        type: 'like',
        postId: post.id,
        message: `${req.user.username} liked your post`,
      });
    }
  }

  const likesCount = await Post.getLikesCount(post.id);
  cache.del(`feed:${userId}`);
  res.json({ likesCount, liked: !alreadyLiked });
}

async function addComment(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = await Post.addComment(post.id, req.user.id, req.body.text, req.body.parentId || null);

    if (post.author.id !== req.user.id) {
      createNotification({
        recipientId: post.author.id,
        senderId: req.user.id,
        type: 'comment',
        postId: post.id,
        message: `${req.user.username} commented on your post`,
      }).catch(() => {});
    }

    cache.del(`feed:${req.user.id}`);
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
}

async function toggleSave(req, res) {
  const post = await Post.findById(req.params.postId);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  const userId = req.user.id;
  const alreadySaved = await Post.isSavedBy(post.id, userId);

  if (alreadySaved) {
    await Post.unsavePost(post.id, userId);
  } else {
    await Post.savePost(post.id, userId);
  }

  res.json({ saved: !alreadySaved });
}

async function followUser(req, res) {
  const target = await User.findById(req.params.userId);
  if (!target) return res.status(404).json({ message: 'User not found' });
  if (target.id === req.user.id) return res.status(400).json({ message: 'Cannot follow yourself' });

  const alreadyFollowing = await User.isFollowing(req.user.id, target.id);

  if (alreadyFollowing) {
    await User.unfollow(req.user.id, target.id);
  } else {
    await User.follow(req.user.id, target.id);
    await createNotification({
      recipientId: target.id,
      senderId: req.user.id,
      type: 'follow',
      message: `${req.user.username} started following you`,
    });
  }

  res.json({ following: !alreadyFollowing });
}

async function getComments(req, res, next) {
  try {
    const comments = await Post.getComments(req.params.postId, req.user.id);
    res.json({ comments });
  } catch (err) {
    next(err);
  }
}

async function deleteComment(req, res, next) {
  try {
    await Post.deleteComment(req.params.commentId, req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

async function toggleCommentLike(req, res, next) {
  try {
    const result = await Post.toggleCommentLike(req.params.commentId, req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function recordShare(req, res) {
  const post = await Post.findById(req.params.postId);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  await Post.recordShare(post.id);
  res.json({ success: true });
}

async function getPost(req, res) {
  const post = await Post.findById(req.params.postId);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  res.json({ post });
}

async function deletePost(req, res) {
  try {
    await Post.deleteById(req.params.postId, req.user.id);
    cache.del(`feed:${req.user.id}`);
    res.json({ success: true });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

async function togglePin(req, res) {
  try {
    const current = await Post.findById(req.params.postId);
    if (!current) return res.status(404).json({ message: 'Post not found' });

    const updated = await Post.updateById(req.params.postId, req.user.id, {
      isPinned: typeof req.body?.pinned === 'boolean' ? req.body.pinned : !current.isPinned,
    });

    res.json({ success: true, post: updated });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

async function updatePostSettings(req, res) {
  try {
    const updates = {};
    if (typeof req.body.caption === 'string') updates.caption = req.body.caption;
    if (typeof req.body.hideLikeCount === 'boolean') updates.hideLikeCount = req.body.hideLikeCount;
    if (typeof req.body.commentsDisabled === 'boolean') updates.commentsDisabled = req.body.commentsDisabled;

    const updated = await Post.updateById(req.params.postId, req.user.id, updates);
    cache.del(`feed:${req.user.id}`);
    res.json({ success: true, post: updated });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
}

module.exports = {
  createPost,
  getFeed,
  getPost,
  deletePost,
  toggleLike,
  addComment,
  getComments,
  deleteComment,
  toggleCommentLike,
  toggleSave,
  togglePin,
  updatePostSettings,
  followUser,
  recordShare,
};
