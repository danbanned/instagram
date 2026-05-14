const prisma = require('../config/prisma');

async function searchLocations(req, res) {
  try {
    const q = String(req.query.q || '').trim();

    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { country: { contains: q, mode: 'insensitive' } }
          ]
        }
      : {};

    const locations = await prisma.location.findMany({
      where,
      include: {
        posts: {
          take: 10,
          include: {
            author: { select: { id: true, username: true, avatarUrl: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      take: 20,
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      locations: locations.map((location) => ({
        id: location.id,
        name: location.name,
        country: location.country,
        latitude: location.latitude,
        longitude: location.longitude,
        postCount: location.posts.length,
        posts: location.posts.map((post) => ({
          id: post.id,
          mediaUrl: post.mediaUrl,
          mediaType: post.mediaType,
          caption: post.caption,
          author: post.author
        }))
      }))
    });
  } catch (error) {
    console.error('Location search error:', error);
    res.status(500).json({ error: 'Failed to search locations' });
  }
}

module.exports = { searchLocations };
