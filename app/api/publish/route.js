const prisma = require('../../../prisma/config.js');

export async function POST(request) {
  try {
    const body = await request.json();
    const { imageUrl, prompt } = body;

    // Validation
    if (!imageUrl) {
      return Response.json(
        { error: 'imageUrl is required' },
        { status: 400 }
      );
    }

    if (!prompt) {
      return Response.json(
        { error: 'prompt is required' },
        { status: 400 }
      );
    }

    if (typeof imageUrl !== 'string' || !imageUrl.trim()) {
      return Response.json(
        { error: 'imageUrl must be a non-empty string' },
        { status: 400 }
      );
    }

    if (typeof prompt !== 'string') {
      return Response.json(
        { error: 'prompt must be a string' },
        { status: 400 }
      );
    }

    // Create record in database
    const image = await prisma.publishedImage.create({
      data: {
        imageUrl: imageUrl.trim(),
        prompt: prompt.trim(),
      },
    });

    return Response.json(image, { status: 201 });

  } catch (error) {
    console.error('Database error:', error);
    
    return Response.json(
      { error: 'Failed to publish image' },
      { status: 500 }
    );
  }
}