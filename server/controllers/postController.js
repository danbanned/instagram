const Post = require('../models/Post');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { createNotification } = require('../services/notificationService');
const cache = require('../services/cacheService');
const { toPublicMediaPath, getMediaType } = require('../services/storageService');

async function createPost(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  if (!req.file) return res.status(400).json({ message: 'Media file is required' });

  const post = await Post.create({
    authorId: req.user.id,
    caption: req.body.caption || '',
    mediaUrl: toPublicMediaPath(req.file),
    mediaType: getMediaType(req.file.mimetype)
  });

  cache.del('feed:latest');
  res.status(201).json(post);
}

async function getFeed(req, res) {
  const cached = cache.get('feed:latest');
  if (cached) return res.json(cached);

  const posts = await Post.getFeed();

  cache.set('feed:latest', posts);
  res.json(posts);
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
        message: `${req.user.username} liked your post`
      });
    }
  }

  const likesCount = await Post.getLikesCount(post.id);
  cache.del('feed:latest');
  res.json({ likesCount, liked: !alreadyLiked });
}

async function addComment(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const post = await Post.findById(req.params.postId);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  const comment = await Post.addComment(post.id, req.user.id, req.body.text);

  if (post.author.id !== req.user.id) {
    await createNotification({
      recipientId: post.author.id,
      senderId: req.user.id,
      type: 'comment',
      postId: post.id,
      message: `${req.user.username} commented on your post`
    });
  }

  cache.del('feed:latest');
  res.status(201).json(comment);
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
      message: `${req.user.username} started following you`
    });
  }

  res.json({ following: !alreadyFollowing });
}

module.exports = { createPost, getFeed, toggleLike, addComment, followUser };
