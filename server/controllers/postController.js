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
    author: req.user._id,
    caption: req.body.caption || '',
    mediaUrl: toPublicMediaPath(req.file),
    mediaType: getMediaType(req.file.mimetype)
  });

  cache.del('feed:latest');
  const populated = await post.populate('author', 'username avatarUrl');
  res.status(201).json(populated);
}

async function getFeed(req, res) {
  const cached = cache.get('feed:latest');
  if (cached) return res.json(cached);

  const posts = await Post.find()
    .populate('author', 'username avatarUrl')
    .populate('comments.user', 'username avatarUrl')
    .sort({ createdAt: -1 })
    .limit(50);

  cache.set('feed:latest', posts);
  res.json(posts);
}

async function toggleLike(req, res) {
  const post = await Post.findById(req.params.postId);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  const userId = String(req.user._id);
  const alreadyLiked = post.likes.some((id) => String(id) === userId);

  if (alreadyLiked) {
    post.likes = post.likes.filter((id) => String(id) !== userId);
  } else {
    post.likes.push(req.user._id);

    if (String(post.author) !== userId) {
      await createNotification({
        recipient: post.author,
        sender: req.user._id,
        type: 'like',
        post: post._id,
        message: `${req.user.username} liked your post`
      });
    }
  }

  await post.save();
  cache.del('feed:latest');
  res.json({ likesCount: post.likes.length, liked: !alreadyLiked });
}

async function addComment(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const post = await Post.findById(req.params.postId);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  post.comments.push({ user: req.user._id, text: req.body.text });
  await post.save();
  await post.populate('comments.user', 'username avatarUrl');

  if (String(post.author) !== String(req.user._id)) {
    await createNotification({
      recipient: post.author,
      sender: req.user._id,
      type: 'comment',
      post: post._id,
      message: `${req.user.username} commented on your post`
    });
  }

  cache.del('feed:latest');
  res.status(201).json(post.comments[post.comments.length - 1]);
}

async function followUser(req, res) {
  const target = await User.findById(req.params.userId);
  if (!target) return res.status(404).json({ message: 'User not found' });
  if (String(target._id) === String(req.user._id)) return res.status(400).json({ message: 'Cannot follow yourself' });

  const me = await User.findById(req.user._id);
  const isFollowing = me.following.some((id) => String(id) === String(target._id));

  if (isFollowing) {
    me.following = me.following.filter((id) => String(id) !== String(target._id));
    target.followers = target.followers.filter((id) => String(id) !== String(me._id));
  } else {
    me.following.push(target._id);
    target.followers.push(me._id);
    await createNotification({
      recipient: target._id,
      sender: me._id,
      type: 'follow',
      message: `${me.username} started following you`
    });
  }

  await me.save();
  await target.save();

  res.json({ following: !isFollowing });
}

module.exports = { createPost, getFeed, toggleLike, addComment, followUser };
