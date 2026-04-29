const prisma = require('../config/prisma');

async function findById(id) {
  const user = await prisma.user.findUnique({ 
    where: { id },
    include: { profile: true }
  });
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}

async function findOne({ email, username } = {}) {
  if (!email && !username) return null;
  const conditions = [];
  if (email) conditions.push({ email });
  if (username) conditions.push({ username });
  return prisma.user.findFirst({ where: { OR: conditions } });
}

async function create({ username, email, password, bio = '', avatarUrl = '' }) {
  const user = await prisma.user.create({
    data: {
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      bio,
      avatarUrl,
    },
  });
  const { password: _, ...rest } = user;
  return rest;
}

async function isFollowing(followerId, followingId) {
  const follow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
  return follow !== null;
}

async function follow(followerId, followingId) {
  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId, followingId } },
    update: {},
    create: { followerId, followingId },
  });
}

async function unfollow(followerId, followingId) {
  await prisma.follow.deleteMany({ where: { followerId, followingId } });
}

async function getFollowersCount(userId) {
  return prisma.follow.count({ where: { followingId: userId } });
}

async function getFollowingCount(userId) {
  return prisma.follow.count({ where: { followerId: userId } });
}

async function getPostsCount(userId) {
  return prisma.post.count({ where: { authorId: userId } });
}

async function search(query, { excludeId, limit = 20 } = {}) {
  return prisma.user.findMany({
    where: {
      ...(excludeId ? { id: { not: excludeId } } : {}),
      username: { contains: query, mode: 'insensitive' },
    },
    select: { id: true, username: true, avatarUrl: true },
    take: limit,
    orderBy: { username: 'asc' },
  });
}

async function getFollowing(userId, { limit = 30 } = {}) {
  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    include: { following: { select: { id: true, username: true, avatarUrl: true } } },
    take: limit,
  });
  return follows.map(f => f.following);
}

module.exports = { findById, findOne, create, isFollowing, follow, unfollow, getFollowersCount, getFollowingCount, getPostsCount, search, getFollowing };
