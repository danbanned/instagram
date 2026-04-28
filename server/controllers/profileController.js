const prisma = require('../config/prisma');

/**
 * @desc    Get user profile data
 * @route   GET /api/profile/:userId
 * @access  Public (or Private depending on protect middleware)
 */
async function getProfile(req, res) {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;
    
    // Get user with basic stats and posts
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        posts: {
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { likes: true, comments: true } }
          }
        },
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if current user follows this profile
    let isFollowing = false;
    if (currentUserId) {
      const follow = await prisma.follow.findFirst({
        where: { followerId: currentUserId, followingId: userId }
      });
      isFollowing = !!follow;
    }

    // Check if this is the current user's own profile
    const isOwnProfile = currentUserId === userId;

    // Get highlights
    const highlights = await prisma.highlight.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    // Check if user has an active story
    const now = new Date();
    const activeStory = await prisma.story.findFirst({
      where: { userId, expiresAt: { gt: now }, isArchived: false }
    });

    // Get followers and following lists for modals
    const followersList = await prisma.follow.findMany({
      where: { followingId: userId },
      include: { follower: { select: { id: true, username: true, avatarUrl: true, profile: { select: { name: true } } } } },
      take: 50
    });
    const followingList = await prisma.follow.findMany({
      where: { followerId: userId },
      include: { following: { select: { id: true, username: true, avatarUrl: true, profile: { select: { name: true } } } } },
      take: 50
    });

    // Format response
    const profileData = {
      userId: user.id,
      username: user.username,
      name: user.profile?.name || user.username,
      avatar: user.avatarUrl,
      bio: user.profile?.bio || user.bio,
      website: user.profile?.website,
      isPrivate: user.profile?.isPrivate || false,
      isBusiness: user.profile?.isBusiness || false,
      hasStory: !!activeStory,
      stats: {
        postsCount: user._count.posts,
        followersCount: user._count.followers,
        followingCount: user._count.following,
        followers: followersList.map(f => ({
          id: f.follower.id,
          username: f.follower.username,
          avatar: f.follower.avatarUrl,
          name: f.follower.profile?.name || f.follower.username,
          isFollowing: false
        })),
        following: followingList.map(f => ({
          id: f.following.id,
          username: f.following.username,
          avatar: f.following.avatarUrl,
          name: f.following.profile?.name || f.following.username,
          isFollowing: true
        }))
      },
      isFollowing,
      highlights
    };

    const posts = user.posts.map(post => ({
      id: post.id,
      type: post.mediaType,
      mediaUrl: post.mediaUrl,
      caption: post.caption,
      isPinned: !!post.isPinned,
      hideLikeCount: !!post.hideLikeCount,
      commentsDisabled: !!post.commentsDisabled,
      location: post.location,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      createdAt: post.createdAt,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatarUrl
      }
    })).sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json({
      success: true,
      profile: profileData,
      posts,
      isOwnProfile
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

/**
 * @desc    Get reels (video posts) for a user
 * @route   GET /api/profile/:userId/reels
 * @access  Public
 */
async function getReels(req, res) {
  try {
    const { userId } = req.params;

    const reels = await prisma.post.findMany({
      where: { authorId: userId, mediaType: 'video' },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { likes: true, comments: true } }
      }
    });

    const items = reels.map(post => ({
      id: post.id,
      type: 'video',
      mediaUrl: post.mediaUrl,
      caption: post.caption,
      isPinned: !!post.isPinned,
      hideLikeCount: !!post.hideLikeCount,
      commentsDisabled: !!post.commentsDisabled,
      location: post.location,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      createdAt: post.createdAt
    })).sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json({ success: true, items });

  } catch (error) {
    console.error('Reels error:', error);
    res.status(500).json({ error: 'Failed to fetch reels' });
  }
}

/**
 * @desc    Get saved posts for current user
 * @route   GET /api/profile/:userId/saved
 * @access  Private
 */
async function getSavedPosts(req, res) {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    // Only allow user to see their own saved posts
    if (userId !== currentUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const savedPosts = await prisma.savedPost.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            _count: { select: { likes: true, comments: true } },
            author: { select: { username: true, avatarUrl: true } }
          }
        }
      },
      orderBy: { savedAt: 'desc' }
    });

    const items = savedPosts.map(saved => ({
      id: saved.post.id,
      type: saved.post.mediaType,
      mediaUrl: saved.post.mediaUrl,
      caption: saved.post.caption,
      isPinned: !!saved.post.isPinned,
      hideLikeCount: !!saved.post.hideLikeCount,
      commentsDisabled: !!saved.post.commentsDisabled,
      location: saved.post.location,
      likesCount: saved.post._count.likes,
      commentsCount: saved.post._count.comments,
      user: {
        id: saved.post.authorId,
        username: saved.post.author.username,
        avatar: saved.post.author.avatarUrl
      },
      savedAt: saved.savedAt
    }));

    res.json({ success: true, items });

  } catch (error) {
    console.error('Saved posts error:', error);
    res.status(500).json({ error: 'Failed to fetch saved posts' });
  }
}

/**
 * @desc    Get reposts for a user
 * @route   GET /api/profile/:userId/reposts
 * @access  Public
 */
async function getReposts(req, res) {
  try {
    const { userId } = req.params;

    const reposts = await prisma.repost.findMany({
      where: { userId },
      include: {
        originalPost: {
          include: {
            _count: { select: { likes: true, comments: true } },
            author: { select: { username: true, avatarUrl: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const items = reposts.map(repost => ({
      id: repost.originalPost.id,
      type: repost.originalPost.mediaType,
      mediaUrl: repost.originalPost.mediaUrl,
      caption: repost.originalPost.caption,
      likesCount: repost.originalPost._count.likes,
      commentsCount: repost.originalPost._count.comments,
      user: {
        username: repost.originalPost.author.username,
        avatar: repost.originalPost.author.avatarUrl
      },
      repostedAt: repost.createdAt,
      repostCaption: repost.caption
    }));

    res.json({ success: true, items });

  } catch (error) {
    console.error('Reposts error:', error);
    res.status(500).json({ error: 'Failed to fetch reposts' });
  }
}

/**
 * @desc    Get tagged posts for a user
 * @route   GET /api/profile/:userId/tagged
 * @access  Public
 */
async function getTaggedPosts(req, res) {
  try {
    const { userId } = req.params;

    const tags = await prisma.postTag.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            _count: { select: { likes: true, comments: true } },
            author: { select: { username: true, avatarUrl: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const items = tags.map(tag => ({
      id: tag.post.id,
      type: tag.post.mediaType,
      mediaUrl: tag.post.mediaUrl,
      caption: tag.post.caption,
      likesCount: tag.post._count.likes,
      commentsCount: tag.post._count.comments,
      user: {
        username: tag.post.author.username,
        avatar: tag.post.author.avatarUrl
      },
      taggedBy: tag.taggedBy,
      taggedAt: tag.createdAt
    }));

    res.json({ success: true, items });

  } catch (error) {
    console.error('Tagged posts error:', error);
    res.status(500).json({ error: 'Failed to fetch tagged posts' });
  }
}



/**
 * @desc    Update user profile
 * @route   PUT /api/profile/update
 * @access  Private
 */
async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const { name, bio, website, phoneNumber, gender, isPrivate, avatar } = req.body;

    // Update User model (bio and avatarUrl)
    await prisma.user.update({
      where: { id: userId },
      data: {
        bio: bio || '',
        avatarUrl: avatar || ''
      }
    });

    // Update or create Profile model
    const profile = await prisma.profile.upsert({
      where: { userId },
      update: {
        name,
        bio,
        website,
        phoneNumber,
        gender,
        isPrivate
      },
      create: {
        userId,
        name,
        bio,
        website,
        phoneNumber,
        gender,
        isPrivate
      }
    });

    res.json({ success: true, profile });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}


/**
 * @desc    Upload profile picture/avatar
 * @route   POST /api/profile/avatar
 * @access  Private
 */
async function uploadAvatar(req, res) {
  try {
    // Check if file was uploaded by multer
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    const userId = req.user.id;
    
    // Build avatar URL based on your upload structure
    // Your upload middleware saves to /uploads/avatars with UUID filename
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Update user's avatar
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        avatarUrl: avatarUrl,
        updatedAt: new Date()
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        profile: {
          select: {
            name: true,
            bio: true,
            website: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      avatarUrl: avatarUrl,
      user: updatedUser
    });

  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to upload profile picture' 
    });
  }
}

module.exports = {
  getProfile,
  getReels,
  getSavedPosts,
  getReposts,
  getTaggedPosts,
  updateProfile,
  uploadAvatar
};

