const prisma = require('../../../prisma/config.js');

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    let page = parseInt(searchParams.get('page')) || 1;
    let limit = parseInt(searchParams.get('limit')) || 10;

    // Validation
    if (page < 1 || isNaN(page)) {
      return Response.json(
        { error: 'page must be a positive integer' },
        { status: 400 }
      );
    }

    if (limit < 1 || isNaN(limit)) {
      return Response.json(
        { error: 'limit must be a positive integer' },
        { status: 400 }
      );
    }

    // Cap limit at 50
    limit = Math.min(limit, 50);

    const skip = (page - 1) * limit;

    // Get images with pagination
    const [images, total] = await Promise.all([
      prisma.publishedImage.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.publishedImage.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return Response.json({
      images,
      total,
      page,
      totalPages,
    });

  } catch (error) {
    console.error('Database error:', error);
    
    return Response.json(
      { error: 'Failed to fetch feed' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, hearts } = body;

    // Validation
    if (id === undefined || id === null) {
      return Response.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    if (hearts === undefined || hearts === null) {
      return Response.json(
        { error: 'hearts is required' },
        { status: 400 }
      );
    }

    if (typeof id !== 'number' || id < 1) {
      return Response.json(
        { error: 'id must be a positive number' },
        { status: 400 }
      );
    }

    if (typeof hearts !== 'number' || hearts < 0) {
      return Response.json(
        { error: 'hearts must be a non-negative number' },
        { status: 400 }
      );
    }

    // Check if image exists
    const existingImage = await prisma.publishedImage.findUnique({
      where: { id },
    });

    if (!existingImage) {
      return Response.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Update hearts
    const updatedImage = await prisma.publishedImage.update({
      where: { id },
      data: { hearts },
    });

    return Response.json(updatedImage);

  } catch (error) {
    console.error('Database error:', error);
    
    return Response.json(
      { error: 'Failed to update hearts' },
      { status: 500 }
    );
  }
}