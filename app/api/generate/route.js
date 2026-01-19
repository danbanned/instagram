// /app/api/generate/route.js
import { validateApiKey } from "../middleware/auth";
import { rateLimit } from "../middleware/rateLimit";
import { generateDonorText } from "../utils/gemini";
import prisma from "../../../prisma/config";

export const runtime = "nodejs";

// Rate limit: 50 requests per 15 minutes per IP
const RATE_LIMIT_MAX = 50;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request) {
  console.log("🔥 generate endpoint hit");

  try {
    // Get client IP for rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown";

    const rateLimitResult = rateLimit(
      ip,
      RATE_LIMIT_MAX,
      RATE_LIMIT_WINDOW_MS
    );

    if (!rateLimitResult.allowed) {
      return Response.json(
        {
          error: "Rate limit exceeded",
          reset: rateLimitResult.reset,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": RATE_LIMIT_MAX.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.reset,
          },
        }
      );
    }

    // Validate API key
    //const auth = validateApiKey(request);
    //if (!auth.isValid) {
    //  return auth.error;
    //}

    // Parse request body
    const body = await request.json();
    const { prompt, saveToDb = false, donorId } = body;

    // Validation
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return Response.json(
        { error: "prompt must be a non-empty string" },
        { status: 400 }
      );
    }

    if (prompt.length > 2000) {
      return Response.json(
        { error: "prompt must be less than 2000 characters" },
        { status: 400 }
      );
    }

    // Generate text with Gemini
    const result = await generateDonorText(prompt);

    if (!result.success) {
      return Response.json(
        { error: result.error || "Failed to generate text" },
        {
          status: 400,
          headers: {
            "X-RateLimit-Limit": RATE_LIMIT_MAX.toString(),
            "X-RateLimit-Remaining":
              rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset,
          },
        }
      );
    }

    // Optional: persist generated text to DB
    if (saveToDb && donorId) {
      await prisma.donor.update({
        where: { id: donorId },
        data: {
          aiSummary: result.text,
        },
      });
    }

    return Response.json(
      {
        success: true,
        text: result.text,
      },
      {
        status: 200,
        headers: {
          "X-RateLimit-Limit": RATE_LIMIT_MAX.toString(),
          "X-RateLimit-Remaining":
            rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.reset,
        },
      }
    );
  } catch (error) {
    console.error("Generate endpoint error:", error);

    return Response.json(
      {
        error: "Internal server error",
        message: error.message,
      },
      {
        status: 500,
        headers: {
          "X-RateLimit-Limit": RATE_LIMIT_MAX.toString(),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }
}

// CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-api-key",
      "Access-Control-Max-Age": "86400",
    },
  });
}
