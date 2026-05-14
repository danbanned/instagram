const prisma = require('../config/prisma');

function extractHashtags(caption = '') {
  return Array.from(
    new Set(
      (caption.match(/#([a-z0-9_]+)/gi) || [])
        .map((tag) => tag.slice(1).toLowerCase())
        .filter(Boolean)
    )
  );
}

function extractMentions(caption = '') {
  return Array.from(
    new Set(
      (caption.match(/@([a-z0-9_.]+)/gi) || [])
        .map((mention) => mention.slice(1).toLowerCase())
        .filter(Boolean)
    )
  );
}

async function resolveLocation(locationName) {
  const trimmed = locationName?.trim();
  if (!trimmed) return null;

  const existing = await prisma.location.findFirst({
    where: { name: { equals: trimmed, mode: 'insensitive' } }
  });

  if (existing) return existing;

  return prisma.location.create({
    data: { name: trimmed }
  });
}

async function syncPostMetadata({ postId, authorId, caption = '', location = null }) {
  const hashtags = extractHashtags(caption);
  const mentions = extractMentions(caption).filter((username) => username !== undefined);
  const locationRecord = await resolveLocation(location);

  await prisma.post.update({
    where: { id: postId },
    data: {
      mentions,
      locationId: locationRecord?.id || null
    }
  });

  if (hashtags.length) {
    await prisma.hashtag.createMany({
      data: hashtags.map((name) => ({ name })),
      skipDuplicates: true
    });
  }

  const hashtagRecords = hashtags.length
    ? await prisma.hashtag.findMany({ where: { name: { in: hashtags } } })
    : [];

  await prisma.postHashtag.deleteMany({ where: { postId } });
  if (hashtagRecords.length) {
    await prisma.postHashtag.createMany({
      data: hashtagRecords.map((hashtag) => ({
        postId,
        hashtagId: hashtag.id
      })),
      skipDuplicates: true
    });
  }

  const mentionedUsers = mentions.length
    ? await prisma.user.findMany({
        where: {
          username: { in: mentions },
          id: { not: authorId }
        },
        select: { id: true, username: true }
      })
    : [];

  await prisma.postTag.deleteMany({ where: { postId, taggedBy: authorId } });
  if (mentionedUsers.length) {
    for (const user of mentionedUsers) {
      await prisma.postTag.upsert({
        where: {
          postId_userId: {
            postId,
            userId: user.id
          }
        },
        update: {
          taggedBy: authorId
        },
        create: {
          postId,
          userId: user.id,
          taggedBy: authorId
        }
      });
    }
  }

  return {
    hashtags,
    mentions,
    mentionedUsers,
    location: locationRecord
  };
}

module.exports = {
  extractHashtags,
  extractMentions,
  syncPostMetadata
};
