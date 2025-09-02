import { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// In production, consider using Redis or similar for distributed systems
const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configurations
export const RATE_LIMITS = {
  // API endpoints
  '/api/send': { requests: 10, windowMs: 60000 }, // 10 requests per minute
  '/api/quotes': { requests: 30, windowMs: 60000 }, // 30 requests per minute
  '/api/orders': { requests: 30, windowMs: 60000 }, // 30 requests per minute
  '/api/proxy': { requests: 20, windowMs: 60000 }, // 20 requests per minute

  // Default fallback
  default: { requests: 50, windowMs: 60000 }, // 50 requests per minute
} as const;

/**
 * Get client identifier for rate limiting
 * Uses IP address and User-Agent for identification
 */
function getClientId(request: NextRequest): string {
  // Get IP address from headers (Next.js doesn't have request.ip in edge runtime)
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown';

  // Get User-Agent for additional uniqueness
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Create a hash-like identifier (simplified for this implementation)
  const identifier = `${ip}-${userAgent.slice(0, 50)}`;

  return identifier.replace(/[^a-zA-Z0-9\-_]/g, '_');
}

/**
 * Get rate limit configuration for a given endpoint
 */
function getRateLimitConfig(pathname: string): { requests: number; windowMs: number } {
  // Check for exact matches first
  if (pathname in RATE_LIMITS) {
    return RATE_LIMITS[pathname as keyof typeof RATE_LIMITS];
  }

  // Check for pattern matches
  for (const [pattern, config] of Object.entries(RATE_LIMITS)) {
    if (pattern !== 'default' && pathname.startsWith(pattern)) {
      return config;
    }
  }

  return RATE_LIMITS.default;
}

/**
 * Clean up expired entries from the rate limit store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check if request should be rate limited
 */
export function checkRateLimit(request: NextRequest): {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
} {
  const clientId = getClientId(request);
  const pathname = new URL(request.url).pathname;
  const config = getRateLimitConfig(pathname);

  const now = Date.now();
  const windowEnd = now + config.windowMs;

  // Clean up expired entries periodically
  if (Math.random() < 0.1) {
    // 10% chance to cleanup on each request
    cleanupExpiredEntries();
  }

  const key = `${clientId}:${pathname}`;
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // First request in window or window has expired
    rateLimitStore.set(key, {
      count: 1,
      resetTime: windowEnd,
    });

    return {
      allowed: true,
      limit: config.requests,
      remaining: config.requests - 1,
      resetTime: windowEnd,
    };
  }

  if (entry.count >= config.requests) {
    // Rate limit exceeded
    return {
      allowed: false,
      limit: config.requests,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    };
  }

  // Increment counter
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    limit: config.requests,
    remaining: config.requests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Rate limiting middleware for API routes
 */
export function withRateLimit(handler: (request: NextRequest) => Promise<Response>) {
  return async (request: NextRequest): Promise<Response> => {
    const rateLimit = checkRateLimit(request);

    // Add rate limit headers to response
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', rateLimit.limit.toString());
    headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    headers.set('X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString());

    if (!rateLimit.allowed) {
      headers.set('Retry-After', rateLimit.retryAfter!.toString());

      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: `Too many requests. Try again in ${rateLimit.retryAfter} seconds.`,
          retryAfter: rateLimit.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...Object.fromEntries(headers.entries()),
          },
        }
      );
    }

    // Call the original handler
    const response = await handler(request);

    // Add rate limit headers to successful responses
    for (const [key, value] of headers.entries()) {
      response.headers.set(key, value);
    }

    return response;
  };
}

/**
 * Get current rate limit status for a client
 */
export function getRateLimitStatus(request: NextRequest): {
  limit: number;
  remaining: number;
  resetTime: number;
} {
  const clientId = getClientId(request);
  const pathname = new URL(request.url).pathname;
  const config = getRateLimitConfig(pathname);

  const key = `${clientId}:${pathname}`;
  const entry = rateLimitStore.get(key);
  const now = Date.now();

  if (!entry || now > entry.resetTime) {
    return {
      limit: config.requests,
      remaining: config.requests,
      resetTime: now + config.windowMs,
    };
  }

  return {
    limit: config.requests,
    remaining: Math.max(0, config.requests - entry.count),
    resetTime: entry.resetTime,
  };
}
