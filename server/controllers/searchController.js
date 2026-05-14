const prisma = require('../config/prisma');

const DEFAULT_LIMIT = 18;

function extractMatchingHashtags(caption = '', query = '') {
  const matches = caption.match(/#[a-z0-9_]+/gi) || [];
  const normalizedQuery = query.toLowerCase().replace(/^#/, '');

  return matches
    .map((tag) => tag.slice(1))
    .filter((tag) => tag.toLowerCase().includes(normalizedQuery));
}

function scoreUser(user, query) {
  const lowerQuery = query.toLowerCase();
  const username = user.username?.toLowerCase() || '';
  const name = user.profile?.name?.toLowerCase() || '';
  const bio = user.profile?.bio?.toLowerCase() || '';

  let score = 0;

  if (username === lowerQuery) score += 100;
  if (name === lowerQuery) score += 80;
  if (username.startsWith(lowerQuery)) score += 50;
  if (name.startsWith(lowerQuery)) score += 40;
  if (username.includes(lowerQuery)) score += 20;
  if (name.includes(lowerQuery)) score += 15;
  if (bio.includes(lowerQuery)) score += 10;

  return score;
}

async function search(req, res) {
  try {
    const currentUserId = req.user.id;
    const query = (req.query.q || '').trim();
    const type = (req.query.type || 'top').toLowerCase();
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || `${DEFAULT_LIMIT}`, 10), 1), 30);
    const offset = (page - 1) * limit;

    if (!query) {
      const suggestedPostsRaw = await prisma.post.findMany({
        include: {
          author: {
            select: { id: true, username: true, avatarUrl: true }
          },
          _count: { select: { likes: true, comments: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit + 1
      });

      const suggestedUsersRaw = await prisma.user.findMany({
        where: { id: { not: currentUserId } },
        include: {
          profile: { select: { name: true, bio: true } },
          _count: { select: { followers: true, posts: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 6
      });

      const suggestedFollowing = suggestedUsersRaw.length
        ? await prisma.follow.findMany({
            where: {
              followerId: currentUserId,
              followingId: { in: suggestedUsersRaw.map((user) => user.id) }
            },
            select: { followingId: true }
          })
        : [];

      const suggestedFollowingSet = new Set(suggestedFollowing.map((entry) => entry.followingId));

      return res.json({
        success: true,
        query: '',
        type,
        page,
        hasMore: suggestedPostsRaw.length > limit,
        users: suggestedUsersRaw.map((user) => ({
          id: user.id,
          username: user.username,
          name: user.profile?.name || user.username,
          bio: user.profile?.bio || '',
          avatar: user.avatarUrl,
          followersCount: user._count.followers,
          postsCount: user._count.posts,
          isFollowing: suggestedFollowingSet.has(user.id)
        })),
        hashtags: [],
        posts: suggestedPostsRaw.slice(0, limit).map((post) => ({
          id: post.id,
          mediaUrl: post.mediaUrl,
          mediaType: post.mediaType,
          caption: post.caption,
          likesCount: post._count.likes,
          commentsCount: post._count.comments,
          createdAt: post.createdAt,
          user: {
            id: post.author.id,
            username: post.author.username,
            avatar: post.author.avatarUrl
          }
        })),
        audio: [],
        locations: []
      });
    }

    const loweredQuery = query.toLowerCase();
    const userWhere = {
      id: { not: currentUserId },
      OR: [
        { username: { contains: query, mode: 'insensitive' } },
        { profile: { is: { name: { contains: query, mode: 'insensitive' } } } },
        { profile: { is: { bio: { contains: query, mode: 'insensitive' } } } }
      ]
    };

    const needsUsers = type === 'top' || type === 'accounts';
    const needsPosts = type === 'top';
    const needsTags = type === 'top' || type === 'tags';
    const needsAudio = type === 'audio';

    const [usersRaw, postsRaw, audioRaw, hashtagsRaw, locationsRaw] = await Promise.all([
      needsUsers
        ? prisma.user.findMany({
            where: userWhere,
            include: {
              profile: { select: { name: true, bio: true } },
              _count: { select: { followers: true, posts: true } }
            },
            take: type === 'accounts' ? limit : 12
          })
        : Promise.resolve([]),
      (needsPosts || needsTags)
        ? prisma.post.findMany({
            where: {
              OR: [
                { caption: { contains: query, mode: 'insensitive' } },
                { location: { contains: query, mode: 'insensitive' } }
              ]
            },
            include: {
              author: {
                select: { id: true, username: true, avatarUrl: true }
              },
              _count: { select: { likes: true, comments: true } }
            },
            orderBy: { createdAt: 'desc' },
            ...(needsPosts ? { skip: offset, take: limit + 1 } : { take: 60 })
          })
        : Promise.resolve([]),
      needsAudio
        ? prisma.story.findMany({
            where: {
              OR: [
                { audioUrl: { contains: query, mode: 'insensitive' } },
                { text: { contains: query, mode: 'insensitive' } }
              ]
            },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                  profile: { select: { name: true } }
                }
              }
            },
            take: limit * 2,
            orderBy: { createdAt: 'desc' }
          })
        : Promise.resolve([]),
      needsTags
        ? prisma.hashtag.findMany({
            where: { name: { contains: loweredQuery, mode: 'insensitive' } },
            include: {
              posts: {
                select: { id: true }
              }
            },
            take: 15
          })
        : Promise.resolve([]),
      type === 'top'
        ? prisma.location.findMany({
            where: {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { country: { contains: query, mode: 'insensitive' } }
              ]
            },
            include: {
              posts: { select: { id: true } }
            },
            take: 8
          })
        : Promise.resolve([])
    ]);

    const usersFollowing = usersRaw.length
      ? await prisma.follow.findMany({
          where: {
            followerId: currentUserId,
            followingId: { in: usersRaw.map((user) => user.id) }
          },
          select: { followingId: true }
        })
      : [];

    const followingSet = new Set(usersFollowing.map((entry) => entry.followingId));

    const users = usersRaw
      .map((user) => ({
        id: user.id,
        username: user.username,
        name: user.profile?.name || user.username,
        bio: user.profile?.bio || '',
        avatar: user.avatarUrl,
        followersCount: user._count.followers,
        postsCount: user._count.posts,
        isFollowing: followingSet.has(user.id),
        score: scoreUser(user, loweredQuery)
      }))
      .sort((a, b) => b.score - a.score || a.username.localeCompare(b.username))
      .map(({ score, ...user }) => user);

    const allMatchingPosts = postsRaw;
    const hasMore = needsPosts ? allMatchingPosts.length > limit : false;
    const paginatedPosts = needsPosts ? allMatchingPosts.slice(0, limit) : [];

    const posts = paginatedPosts.map((post) => ({
      id: post.id,
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaType,
      caption: post.caption,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      createdAt: post.createdAt,
      user: {
        id: post.author.id,
        username: post.author.username,
        avatar: post.author.avatarUrl
      }
    }));

    const hashtagCounts = new Map();
    for (const hashtag of hashtagsRaw) {
      hashtagCounts.set(hashtag.name, hashtag.posts.length);
    }
    if (needsTags) {
      for (const post of allMatchingPosts) {
        for (const tag of extractMatchingHashtags(post.caption, loweredQuery)) {
          hashtagCounts.set(tag, (hashtagCounts.get(tag) || 0) + 1);
        }
      }
    }

    const hashtags = Array.from(hashtagCounts.entries())
      .map(([name, postsCount]) => ({
        id: name,
        name,
        postsCount
      }))
      .sort((a, b) => b.postsCount - a.postsCount || a.name.localeCompare(b.name))
      .slice(0, 15);

    const audioMap = new Map();
    if (needsAudio) {
      for (const story of audioRaw) {
        const key = story.audioUrl || story.text || story.id;
        if (!audioMap.has(key)) {
          audioMap.set(key, {
            id: key,
            title: story.audioUrl ? story.audioUrl.split('/').pop() : story.text || 'Original audio',
            useCount: 1,
            creator: {
              id: story.user.id,
              username: story.user.username,
              name: story.user.profile?.name || story.user.username,
              avatar: story.user.avatarUrl
            }
          });
        } else {
          audioMap.get(key).useCount += 1;
        }
      }
    }

    const audio = Array.from(audioMap.values()).slice(0, limit);
    const locations = locationsRaw.map((location) => ({
      id: location.id,
      name: location.name,
      country: location.country,
      postCount: location.posts.length
    }));

    res.json({
      success: true,
      query,
      type,
      page,
      hasMore,
      users,
      hashtags,
      posts,
      audio,
      locations
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
}

module.exports = { search };
