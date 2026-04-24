const User = require('../models/User');
const Post = require('../models/Post');


async function getUserProfile(req, res) {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Check if current user follows this user
    const isFollowing = await User.isFollowing(req.user.id, user.id);
    
    // Get counts
    const followersCount = await User.getFollowersCount(user.id);
    const followingCount = await User.getFollowingCount(user.id);
    const postsCount = await User.getPostsCount(user.id);

    res.json({ 
      success: true, 
      user: {
        ...user,
        isFollowing,
        followersCount,
        followingCount,
        postsCount
      }
    });
  } catch (err) {
    console.error('User profile error:', err);
    res.status(500).json({ error: 'Failed to load user profile' });
  }
}

async function getUserPosts(req, res) {
  try {
    const posts = await Post.getByUser(req.params.userId);
    res.json({ success: true, posts });
  } catch (err) {
    console.error('User posts error:', err);
    res.status(500).json({ error: 'Failed to load user posts' });
  }
}

async function searchUsers(req, res) {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ users: [] });
    const users = await User.search(q, { excludeId: req.user.id });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
}

async function getMyFollowing(req, res) {
  try {
    const users = await User.getFollowing(req.user.id);
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load following' });
  }
}

module.exports = { getUserProfile, getUserPosts, searchUsers, getMyFollowing };
