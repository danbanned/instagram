const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { extractHashtags, extractMentions } = require('../services/postMetadataService');

const prisma = new PrismaClient();

const USER_SEEDS = [
  ['only1marie__', 'Miah Marie'],
  ['mcandschmicks', "McCormick & Schmick's"],
  ['taylornickens', 'Taylor Nickens'],
  ['last_of_us_part2ellie', 'Last Of Us'],
  ['d4nn3yfevl0n3', 'Danny Fevlone'],
  ['cityframe.syd', 'Sydney Harper'],
  ['northshoremiles', 'Miles Carter'],
  ['lena.eats', 'Lena Morales'],
  ['fitwithaustin', 'Austin Blake'],
  ['artbykiyo', 'Kiyo Tanaka'],
  ['coffeebyjune', 'June Parker'],
  ['wave.after.wave', 'Nico Reyes'],
  ['pixelbloom', 'Aria Collins'],
  ['bostonbrunchclub', 'Boston Brunch Club'],
  ['atlasandember', 'Atlas Ember'],
  ['runwithria', 'Ria Thompson'],
  ['plantmom.cam', 'Camila Green'],
  ['nocturnenotes', 'Noah Bennett'],
  ['studioamelie', 'Amelie Laurent'],
  ['traveltomo', 'Tomo Sato'],
  ['brooklynbites', 'Brooklyn Bites'],
  ['mountain.mika', 'Mika Dawson'],
  ['carmencaptures', 'Carmen Vega'],
  ['weekendwren', 'Wren Foster'],
];

const BIOS = [
  'Living my best life ✨',
  'Travel enthusiast 🌍 | Photographer 📸',
  'Foodie 🍜 | Coffee addict ☕',
  'Fitness junkie 💪 | Health coach 🥗',
  'Art lover 🎨 | Creative soul ✏️',
  'Tech nerd 💻 | Gamer 🎮',
  'Music lover 🎵 | Concert goer 🎤',
  'Nature explorer 🌿 | Hiker 🥾',
  'Fashionista 👗 | Style blogger 👠',
  'Bookworm 📚 | Writer ✍️',
  'Street photo walks and espresso stops.',
  'Designing quiet corners and loud memories.',
];

const HASHTAGS = [
  'nature', 'travel', 'food', 'fashion', 'fitness', 'art', 'music', 'photography', 'love', 'happy',
  'sunset', 'beach', 'mountains', 'citylife', 'adventure', 'family', 'friends', 'fun', 'summer', 'winter',
  'spring', 'autumn', 'weekend', 'vibes', 'goals', 'coffee', 'brunch', 'wellness', 'streetstyle', 'design',
  'decor', 'reels', 'explore', 'nightout', 'hiking', 'creative', 'mindset', 'portrait', 'foodie', 'wanderlust'
];

const LOCATIONS = [
  ['New York', 'USA', 40.7128, -74.006],
  ['Los Angeles', 'USA', 34.0522, -118.2437],
  ['Chicago', 'USA', 41.8781, -87.6298],
  ['Miami', 'USA', 25.7617, -80.1918],
  ['Seattle', 'USA', 47.6062, -122.3321],
  ['Austin', 'USA', 30.2672, -97.7431],
  ['Boston', 'USA', 42.3601, -71.0589],
  ['Denver', 'USA', 39.7392, -104.9903],
  ['Portland', 'USA', 45.5152, -122.6784],
  ['Atlanta', 'USA', 33.749, -84.388],
  ['Toronto', 'Canada', 43.6532, -79.3832],
  ['Vancouver', 'Canada', 49.2827, -123.1207],
  ['London', 'UK', 51.5074, -0.1278],
  ['Manchester', 'UK', 53.4808, -2.2426],
  ['Sydney', 'Australia', -33.8688, 151.2093],
  ['Melbourne', 'Australia', -37.8136, 144.9631],
  ['Tokyo', 'Japan', 35.6762, 139.6503],
  ['Kyoto', 'Japan', 35.0116, 135.7681],
  ['Paris', 'France', 48.8566, 2.3522],
  ['Berlin', 'Germany', 52.52, 13.405],
  ['Rome', 'Italy', 41.9028, 12.4964],
  ['Barcelona', 'Spain', 41.3874, 2.1686],
  ['Sao Paulo', 'Brazil', -23.5558, -46.6396],
  ['Lisbon', 'Portugal', 38.7223, -9.1393],
];

const AUDIO_TRACKS = [
  ['Midnight Drive', 'Nova Nights', 31],
  ['Slow Bloom', 'Ivory Echo', 24],
  ['Stay Golden', 'June Motel', 28],
  ['Skyline Loop', 'Eastbound', 22],
  ['Soft Focus', 'Kiyo', 19],
  ['City Static', 'Paper Maps', 34],
  ['Summer Tape', 'Harbor Club', 27],
  ['Open Window', 'Ria Rivers', 25],
  ['Neon Steps', 'Afterhours', 32],
  ['Somewhere Warm', 'Atlas Ember', 29],
  ['Coastline', 'Tomo Sato', 30],
  ['Parallel Hearts', 'Carmen Vega', 26],
];

const IMAGE_IDS = [10, 15, 20, 25, 29, 30, 35, 39, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95];
const VIDEO_URLS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
];

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function shuffle(list) {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function sample(list, count) {
  return shuffle(list).slice(0, count);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDateWithinDays(days) {
  return new Date(Date.now() - Math.floor(Math.random() * days * 24 * 60 * 60 * 1000));
}

function buildCaption({ locationName, hashtags, mentions }) {
  const lead = randomItem([
    `Golden hour in ${locationName} and I am not over it yet.`,
    `Posting this before I forget how good ${locationName} felt.`,
    `Still thinking about this moment from ${locationName}.`,
    `A little snapshot from ${locationName}.`,
    `Keeping this one here from ${locationName}.`
  ]);

  const mentionText = mentions.length
    ? ` ${sample(mentions, Math.min(2, mentions.length)).map((username) => `@${username}`).join(' ')}`
    : '';

  return `${lead}${mentionText} ${hashtags.map((tag) => `#${tag}`).join(' ')}`.trim();
}

async function clearDatabase() {
  const requiredModels = ['postHashtag', 'hashtag', 'location'];
  const missingModels = requiredModels.filter((modelName) => !prisma[modelName]);

  if (missingModels.length) {
    throw new Error(
      `Prisma client is out of date. Missing models: ${missingModels.join(', ')}. ` +
      'Run `npm run db:reset` or `npx prisma db push && npx prisma generate` in `/server` first.'
    );
  }

  try {
    await prisma.storyReaction.deleteMany();
    await prisma.storyReply.deleteMany();
    await prisma.storyView.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.savedPost.deleteMany();
    await prisma.commentLike.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.postLike.deleteMany();
    await prisma.postHashtag.deleteMany();
    await prisma.postTag.deleteMany();
    await prisma.postAnalytics.deleteMany();
    await prisma.repost.deleteMany();
    await prisma.story.deleteMany();
    await prisma.highlight.deleteMany();
    await prisma.post.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.location.deleteMany();
    await prisma.hashtag.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.user.deleteMany();
  } catch (error) {
    if (error?.code === 'P2021') {
      throw new Error(
        `Database schema is behind the Prisma schema. Missing table: ${error.meta?.table || 'unknown'}. ` +
        'Run `npm run db:reset` from the repo root, or `npx prisma db push --force-reset && npx prisma generate` inside `/server`, then rerun the seed.'
      );
    }

    throw error;
  }
}

async function main() {
  console.log('Seeding database...');
  await clearDatabase();

  const password = await bcrypt.hash('password123', 10);

  const users = [];
  for (let index = 0; index < USER_SEEDS.length; index += 1) {
    const [username, name] = USER_SEEDS[index];
    const user = await prisma.user.create({
      data: {
        username,
        email: `${username}@example.com`,
        password,
        bio: randomItem(BIOS),
        avatarUrl: `https://i.pravatar.cc/300?img=${index + 1}`,
        profile: {
          create: {
            name,
            bio: randomItem(BIOS),
            website: `https://${username.replace(/_/g, '')}.example.com`,
            isPrivate: Math.random() > 0.88,
            category: randomItem(['United States', 'Canada', 'UK', 'Australia', 'Japan', 'France'])
          }
        }
      },
      include: { profile: true }
    });
    users.push(user);
  }

  await prisma.hashtag.createMany({
    data: HASHTAGS.map((name) => ({ name })),
    skipDuplicates: true
  });
  const hashtagRecords = await prisma.hashtag.findMany();

  const locationRecords = [];
  for (const [name, country, latitude, longitude] of LOCATIONS) {
    const location = await prisma.location.create({
      data: { name, country, latitude, longitude }
    });
    locationRecords.push(location);
  }

  for (const user of users) {
    const targets = sample(users.filter((candidate) => candidate.id !== user.id), randomInt(6, 14));
    for (const target of targets) {
      await prisma.follow.upsert({
        where: { followerId_followingId: { followerId: user.id, followingId: target.id } },
        update: {},
        create: { followerId: user.id, followingId: target.id }
      });
    }
  }

  const posts = [];
  for (const user of users) {
    const postCount = randomInt(3, 5);
    for (let index = 0; index < postCount; index += 1) {
      const hashtags = sample(HASHTAGS, randomInt(2, 5));
      const location = randomItem(locationRecords);
      const mentionedUsers = sample(
        users.filter((candidate) => candidate.id !== user.id).map((candidate) => candidate.username),
        randomInt(0, 3)
      );
      const mediaType = Math.random() > 0.82 ? 'video' : 'image';
      const caption = buildCaption({
        locationName: location.name,
        hashtags,
        mentions: mentionedUsers
      });

      const post = await prisma.post.create({
        data: {
          authorId: user.id,
          mediaUrl: mediaType === 'video'
            ? randomItem(VIDEO_URLS)
            : `https://picsum.photos/id/${randomItem(IMAGE_IDS)}/900/900`,
          mediaType,
          caption,
          location: location.name,
          locationId: location.id,
          mentions: extractMentions(caption),
          isPinned: index === 0 && Math.random() > 0.65,
          hideLikeCount: Math.random() > 0.93,
          commentsDisabled: Math.random() > 0.95,
          createdAt: randomDateWithinDays(45),
          updatedAt: new Date()
        }
      });

      posts.push(post);

      const linkedHashtags = hashtagRecords.filter((record) => extractHashtags(caption).includes(record.name));
      if (linkedHashtags.length) {
        await prisma.postHashtag.createMany({
          data: linkedHashtags.map((hashtag) => ({
            postId: post.id,
            hashtagId: hashtag.id
          })),
          skipDuplicates: true
        });
      }

      const mentioned = await prisma.user.findMany({
        where: {
          username: { in: extractMentions(caption) },
          id: { not: user.id }
        }
      });

      if (mentioned.length) {
        for (const mentionedUser of mentioned) {
          await prisma.postTag.upsert({
            where: {
              postId_userId: {
                postId: post.id,
                userId: mentionedUser.id
              }
            },
            update: {
              taggedBy: user.id
            },
            create: {
              postId: post.id,
              userId: mentionedUser.id,
              taggedBy: user.id
            }
          });
        }

        await prisma.notification.createMany({
          data: mentioned.map((mentionedUser) => ({
            recipientId: mentionedUser.id,
            senderId: user.id,
            type: 'mention',
            postId: post.id,
            message: `${user.username} mentioned you in a post`,
            isRead: Math.random() > 0.5,
            createdAt: randomDateWithinDays(30)
          }))
        });
      }

      const likingUsers = sample(users.filter((candidate) => candidate.id !== user.id), randomInt(5, 18));
      if (likingUsers.length) {
        await prisma.postLike.createMany({
          data: likingUsers.map((liker) => ({
            userId: liker.id,
            postId: post.id
          })),
          skipDuplicates: true
        });
      }

      const commentCount = randomInt(1, 8);
      for (let commentIndex = 0; commentIndex < commentCount; commentIndex += 1) {
        const commenter = randomItem(users.filter((candidate) => candidate.id !== user.id));
        await prisma.comment.create({
          data: {
            postId: post.id,
            userId: commenter.id,
            text: randomItem([
              'This is so good 🔥',
              'Love this shot',
              'Absolutely obsessed with this',
              'Need this on my feed ASAP',
              'The vibes here are unreal ✨',
              'Adding this to my inspiration folder'
            ]),
            createdAt: randomDateWithinDays(25)
          }
        });
      }

      await prisma.postAnalytics.create({
        data: {
          postId: post.id,
          reach: randomInt(400, 7000),
          impressions: randomInt(700, 11000),
          profileVisits: randomInt(20, 400),
          shares: randomInt(0, 90),
          saves: randomInt(0, 160)
        }
      });
    }
  }

  for (const user of users) {
    const saveablePosts = sample(posts.filter((post) => post.authorId !== user.id), randomInt(5, 12));
    if (saveablePosts.length) {
      await prisma.savedPost.createMany({
        data: saveablePosts.map((post) => ({
          userId: user.id,
          postId: post.id,
          savedAt: randomDateWithinDays(20)
        })),
        skipDuplicates: true
      });
    }
  }

  for (const user of users.slice(0, 14)) {
    const storyCount = randomInt(1, 2);
    for (let index = 0; index < storyCount; index += 1) {
      const [trackName, artist, duration] = randomItem(AUDIO_TRACKS);
      await prisma.story.create({
        data: {
          userId: user.id,
          mediaUrl: `https://picsum.photos/id/${randomItem(IMAGE_IDS)}/720/1280`,
          mediaType: 'image',
          text: randomItem([
            `Now playing ${trackName}`,
            'Weekend reset',
            'A little check-in',
            'Current mood'
          ]),
          audioId: `${trackName.toLowerCase().replace(/\s+/g, '-')}-${artist.toLowerCase().replace(/\s+/g, '-')}`,
          audioUrl: `https://audio.example.com/${encodeURIComponent(trackName)}.mp3`,
          duration: duration * 1000,
          isArchived: Math.random() > 0.4,
          archivedAt: randomDateWithinDays(15),
          createdAt: randomDateWithinDays(12),
          expiresAt: new Date(Date.now() + randomInt(2, 18) * 60 * 60 * 1000)
        }
      });
    }
  }

  const postCount = await prisma.post.count();
  const savedCount = await prisma.savedPost.count();
  const storyCount = await prisma.story.count();
  const notificationCount = await prisma.notification.count();

  console.log(`Seed complete.
Users: ${users.length}
Hashtags: ${hashtagRecords.length}
Locations: ${locationRecords.length}
Posts: ${postCount}
Saved posts: ${savedCount}
Stories: ${storyCount}
Notifications: ${notificationCount}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
