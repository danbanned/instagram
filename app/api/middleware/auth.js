// /app/api/middleware/auth.js
export function validateApiKey(request) {
  const apiKey = request.headers.get('x-api-key');
  
  // In production, you should store API keys securely in database or environment
  const validApiKey = process.env.API_KEY || 'your-secret-api-key';
  
  if (!apiKey || apiKey !== validApiKey) {
    return {
      isValid: false,
      error: Response.json(
        { error: 'Invalid or missing API key' },
        { status: 401 }
      )
    };
  }
  
  return { isValid: true };
}