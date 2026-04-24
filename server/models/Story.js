const prisma = require('../config/prisma');

async function getTray(userId) {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Get IDs of users the current user follows
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const followingIds = following.map((f) => f.followingId);

  if (!followingIds.length) return [];

  // Fetch active stories from followed users
  const stories = await prisma.story.findMany({
    where: {
      userId: { in: followingIds },
      expiresAt: { gt: new Date() },
      createdAt: { gt: twentyFourHoursAgo },
    },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Group stories by user, one entry per user
  const userMap = new Map();
  for (const story of stories) {
    if (!userMap.has(story.userId)) {
      userMap.set(story.userId, {
        userId: story.userId,
        username: story.user.username,
        avatar: story.user.avatarUrl || null,
        hasStory: true,
        isMyStory: false,
        seen: story.seenBy.includes(userId),
        latestStoryId: story.id,
      });
    }
  }

  return Array.from(userMap.values()).slice(0, 15);
}

async function create({ userId, mediaUrl, mediaType }) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return prisma.story.create({
    data: { userId, mediaUrl, mediaType: mediaType || 'image', expiresAt },
  });
}

async function markSeen(storyId, viewerUserId) {
  const story = await prisma.story.findUnique({ where: { id: storyId } });
  if (!story || story.seenBy.includes(viewerUserId)) return;

  await prisma.story.update({
    where: { id: storyId },
    data: { seenBy: { push: viewerUserId } },
  });
}

async function getByUser(userId) {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return prisma.story.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() },
      createdAt: { gt: twentyFourHoursAgo },
    },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

async function findById(id) {
  return prisma.story.findUnique({ where: { id } });
}

async function deleteById(id) {
  await prisma.story.delete({ where: { id } });
}

module.exports = { getTray, create, findById, deleteById, markSeen, getByUser };
