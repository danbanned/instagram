const User = require('../models/User');
const Post = require('../models/Post');
const prisma = require('../config/prisma');


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

    // Check for active stories
    const activeStories = await prisma.story.findMany({
      where: {
        userId: user.id,
        expiresAt: { gt: new Date() }
      }
    });

    res.json({ 
      success: true, 
      user: {
        ...user,
        isFollowing,
        followersCount,
        followingCount,
        postsCount,
        hasActiveStory: activeStories.length > 0
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

async function getSuggestions(req, res) {
  try {
    const userId = req.user.id;

    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        followers: {
          none: { followerId: userId }
        }
      },
      include: {
        profile: { select: { name: true } },
        followers: {
          take: 2,
          include: {
            follower: { select: { username: true } }
          }
        }
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      users: users.map((user) => ({
        id: user.id,
        username: user.username,
        avatar: user.avatarUrl,
        fullName: user.profile?.name || user.username,
        followedBy: user.followers[0]?.follower?.username || null,
        suggested: true,
        isFollowing: false
      }))
    });
  } catch (err) {
    console.error('Suggestions error:', err);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
}

async function removeFollower(req, res) {
  try {
    const { followerId } = req.params;

    await prisma.follow.deleteMany({
      where: {
        followerId,
        followingId: req.user.id
      }
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Remove follower error:', err);
    res.status(500).json({ error: 'Failed to remove follower' });
  }
}

module.exports = { getUserProfile, getUserPosts, searchUsers, getMyFollowing, getSuggestions, removeFollower };
