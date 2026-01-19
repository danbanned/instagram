// /app/api/publish/route.js - Updated with authentication and rate limiting
import { validateApiKey } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';
import prisma from '../../../prisma/config';

// Rate limit: 100 requests per 15 minutes per IP
const RATE_LIMIT_MAX = 100;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    
    // Check rate limit
    const rateLimitResult = rateLimit(ip, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
    if (!rateLimitResult.allowed) {
      return Response.json(
        { 
          error: 'Rate limit exceeded',
          reset: rateLimitResult.reset
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.reset
          }
        }
      );
    }
    
    // Validate API key
    const auth = validateApiKey(request);
    if (!auth.isValid) {
      return auth.error;
    }
    
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
    
    // Validate URL format (basic check)
    try {
      new URL(imageUrl);
    } catch {
      return Response.json(
        { error: 'imageUrl must be a valid URL' },
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

    return Response.json(
      image, 
      { 
        status: 201,
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset
        }
      }
    );

  } catch (error) {
    console.error('Database error:', error);
    
    return Response.json(
      { error: 'Failed to publish image' },
      { 
        status: 500,
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
          'X-RateLimit-Remaining': '0'
        }
      }
    );
  }
}