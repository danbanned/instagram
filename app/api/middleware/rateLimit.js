// /app/api/middleware/rateLimit.js
const rateLimitStore = new Map();

export function rateLimit(ip, limit = 100, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, []);
  }
  
  const requests = rateLimitStore.get(ip);
  
  // Clean up old requests
  while (requests.length > 0 && requests[0] < windowStart) {
    requests.shift();
  }
  
  if (requests.length >= limit) {
    return {
      allowed: false,
      remaining: 0,
      reset: new Date(requests[0] + windowMs).toISOString()
    };
  }
  
  requests.push(now);
  rateLimitStore.set(ip, requests);
  
  return {
    allowed: true,
    remaining: limit - requests.length,
    reset: new Date(now + windowMs).toISOString()
  };
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  
  for (const [ip, requests] of rateLimitStore.entries()) {
    const filtered = requests.filter(time => now - time < windowMs);
    if (filtered.length === 0) {
      rateLimitStore.delete(ip);
    } else {
      rateLimitStore.set(ip, filtered);
    }
  }
}, 60000); // Clean up every minute