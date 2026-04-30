const prisma = require('../config/prisma');

const POST_INCLUDE = {
  author: { select: { id: true, username: true, avatarUrl: true } },
  comments: {
    include: { user: { select: { id: true, username: true, avatarUrl: true } } },
    orderBy: { createdAt: 'asc' },
  },
  _count: { select: { likes: true } },
};

function transformPost(post, likedByMe = false, savedByMe = false) {
  return {
    id: post.id,
    caption: post.caption,
    mediaUrl: post.mediaUrl,
    mediaType: post.mediaType,
    location: post.location || null,
    isPinned: !!post.isPinned,
    isAIGenerated: post.isAIGenerated || false,
    hideLikeCount: !!post.hideLikeCount,
    commentsDisabled: !!post.commentsDisabled,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    likesCount: post._count?.likes || 0,
    likedByMe,
    savedByMe,
    comments: post.comments?.map((c) => ({
      id: c.id,
      text: c.text,
      createdAt: c.createdAt,
      user: { id: c.user.id, username: c.user.username, avatarUrl: c.user.avatarUrl },
    })) || [],
    author: {
      id: post.author.id,
      username: post.author.username,
      avatarUrl: post.author.avatarUrl,
    },
  };
}

async function create({ authorId, caption, mediaUrl, mediaType, location, altText, hideLikeCount, commentsDisabled }) {
  const { _count, ...includeWithoutCount } = POST_INCLUDE;

  const post = await prisma.post.create({
    data: {
      authorId,
      caption: caption || '',
      mediaUrl,
      mediaType,
      location:         location         || null,
      altText:          altText          || null,
      hideLikeCount:    !!hideLikeCount,
      commentsDisabled: !!commentsDisabled,
    },
    include: includeWithoutCount,
  });
  return transformPost(post);
}

async function findById(id) {
  const post = await prisma.post.findUnique({ where: { id }, include: POST_INCLUDE });
  return post ? transformPost(post) : null;
}

async function deleteById(id, userId) {
  const post = await prisma.post.findUnique({ where: { id }, select: { id: true, authorId: true } });
  if (!post) throw Object.assign(new Error('Post not found'), { status: 404 });
  if (post.authorId !== userId) throw Object.assign(new Error('Unauthorized'), { status: 403 });
  await prisma.post.delete({ where: { id } });
}

async function updateById(id, userId, data) {
  const post = await prisma.post.findUnique({ where: { id }, select: { id: true, authorId: true } });
  if (!post) throw Object.assign(new Error('Post not found'), { status: 404 });
  if (post.authorId !== userId) throw Object.assign(new Error('Unauthorized'), { status: 403 });

  const updated = await prisma.post.update({
    where: { id },
    data,
    include: POST_INCLUDE,
  });

  return transformPost(updated);
}

async function getFeed(userId, { cursor, limit = 10 } = {}) {
  const query = {
    include: POST_INCLUDE,
    orderBy: { createdAt: 'desc' },
    take: limit,
  };

  if (cursor) {
    query.cursor = { id: cursor };
    query.skip = 1;
  }

  const posts = await prisma.post.findMany(query);

  let likedSet = new Set();
  let savedSet = new Set();

  if (userId && posts.length) {
    const postIds = posts.map((p) => p.id);

    const [likes, saves] = await Promise.all([
      prisma.postLike.findMany({
        where: { userId, postId: { in: postIds } },
        select: { postId: true },
      }),
      prisma.savedPost.findMany({
        where: { userId, postId: { in: postIds } },
        select: { postId: true },
      }),
    ]);

    likedSet = new Set(likes.map((l) => l.postId));
    savedSet = new Set(saves.map((s) => s.postId));
  }

  const formattedPosts = posts.map((post) =>
    transformPost(post, likedSet.has(post.id), savedSet.has(post.id))
  );

  const nextCursor = posts.length === limit ? posts[posts.length - 1].id : null;

  return { posts: formattedPosts, nextCursor, hasMore: posts.length === limit };
}

async function isLikedBy(postId, userId) {
  const like = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId } },
  });
  return like !== null;
}

async function addLike(postId, userId) {
  await prisma.postLike.upsert({
    where: { postId_userId: { postId, userId } },
    update: {},
    create: { postId, userId },
  });
}

async function removeLike(postId, userId) {
  await prisma.postLike.deleteMany({ where: { postId, userId } });
}

async function getLikesCount(postId) {
  return prisma.postLike.count({ where: { postId } });
}

function transformComment(c, currentUserId) {
  return {
    id: c.id,
    text: c.text,
    createdAt: c.createdAt,
    user: { id: c.user.id, username: c.user.username, avatarUrl: c.user.avatarUrl },
    likesCount: c._count?.likes || 0,
    isLiked: c.likes?.length > 0,
    isAuthor: c.userId === currentUserId,
    replies: (c.replies || []).map((r) => transformComment(r, currentUserId)),
  };
}

async function getComments(postId, currentUserId) {
  const comments = await prisma.comment.findMany({
    where: { postId, parentId: null },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true } },
      replies: {
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
          _count: { select: { likes: true } },
          likes: { where: { userId: currentUserId }, select: { userId: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
      _count: { select: { likes: true } },
      likes: { where: { userId: currentUserId }, select: { userId: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return comments.map((c) => transformComment(c, currentUserId));
}

// ✅ FIXED: Removed _count from create operation
async function addComment(postId, userId, text, parentId = null) {
  const comment = await prisma.comment.create({
    data: { 
      postId, 
      userId, 
      text, 
      ...(parentId ? { parentId } : {}) 
    },
    include: {
      user: { 
        select: { 
          id: true, 
          username: true, 
          avatarUrl: true 
        } 
      },
      // ❌ REMOVED _count - doesn't work with create()
    },
  });
  
  // Return comment with default values (new comment has 0 likes)
  return {
    id: comment.id,
    text: comment.text,
    createdAt: comment.createdAt,
    userId: comment.userId,
    user: { 
      id: comment.user.id, 
      username: comment.user.username, 
      avatarUrl: comment.user.avatarUrl 
    },
    likesCount: 0,        // New comment starts with 0 likes
    isLiked: false,       // User hasn't liked their own comment yet
    isAuthor: true,       // Current user is the author
    replies: [],
  };
}

async function deleteComment(commentId, userId) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw Object.assign(new Error('Comment not found'), { status: 404 });
  if (comment.userId !== userId) throw Object.assign(new Error('Unauthorized'), { status: 403 });
  await prisma.comment.delete({ where: { id: commentId } });
}

async function toggleCommentLike(commentId, userId) {
  const existing = await prisma.commentLike.findUnique({
    where: { commentId_userId: { commentId, userId } },
  });
  if (existing) {
    await prisma.commentLike.delete({ where: { commentId_userId: { commentId, userId } } });
  } else {
    await prisma.commentLike.create({ data: { commentId, userId } });
  }
  const likesCount = await prisma.commentLike.count({ where: { commentId } });
  return { isLiked: !existing, likesCount };
}

async function isSavedBy(postId, userId) {
  const saved = await prisma.savedPost.findUnique({
    where: { userId_postId: { userId, postId } },
  });
  return saved !== null;
}

async function savePost(postId, userId) {
  await prisma.savedPost.upsert({
    where: { userId_postId: { userId, postId } },
    update: {},
    create: { userId, postId },
  });
}

async function unsavePost(postId, userId) {
  await prisma.savedPost.deleteMany({ where: { postId, userId } });
}

async function recordShare(postId) {
  await prisma.postAnalytics.upsert({
    where: { postId },
    update: { shares: { increment: 1 } },
    create: { postId, shares: 1 },
  });
}

async function getByUser(userId) {
  const posts = await prisma.post.findMany({
    where: { authorId: userId },
    include: POST_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
  return posts.map(p => transformPost(p));
}

module.exports = {
  create,
  findById,
  deleteById,
  updateById,
  getFeed,
  getByUser,
  isLikedBy,
  addLike,
  removeLike,
  getLikesCount,
  getComments,
  addComment,
  deleteComment,
  toggleCommentLike,
  isSavedBy,
  savePost,
  unsavePost,
  recordShare,
};
