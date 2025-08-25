import { NextRequest, NextResponse } from 'next/server';

// Allowed domains for proxy requests - SECURITY: Prevent SSRF attacks
const ALLOWED_DOMAINS = [
  'api.resend.com',
  'maps.googleapis.com',
  'places.googleapis.com',
  'geocoding.googleapis.com',
  'storage.googleapis.com',
  // Add other trusted domains as needed
];

// Security: Blocked internal/private IP ranges
const BLOCKED_IP_PATTERNS = [
  /^127\./, // localhost
  /^10\./, // private class A
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // private class B
  /^192\.168\./, // private class C
  /^169\.254\./, // link-local
  /^0\./, // this network
];

function validateUrl(urlString: string): { isValid: boolean; error?: string } {
  try {
    const url = new URL(urlString);
    
    // Only allow HTTPS for security
    if (url.protocol !== 'https:') {
      return { isValid: false, error: 'Only HTTPS URLs are allowed' };
    }
    
    // Check if domain is in allowlist
    if (!ALLOWED_DOMAINS.includes(url.hostname)) {
      return { isValid: false, error: 'Domain not allowed' };
    }
    
    // Check for blocked IP patterns
    for (const pattern of BLOCKED_IP_PATTERNS) {
      if (pattern.test(url.hostname)) {
        return { isValid: false, error: 'IP address not allowed' };
      }
    }
    
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // SECURITY: Validate URL before making request
    const validation = validateUrl(targetUrl);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 403 });
    }

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'ARK-Dumpster-Proxy/1.0',
      },
      // Security: Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    const data = await response.text();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'text/plain',
        // Restrictive CORS headers
        'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || 'https://arkdumpsterrentals.com',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timeout' }, { status: 408 });
    }
    return NextResponse.json({ error: 'Proxy request failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // SECURITY: Validate URL before making request
    const validation = validateUrl(targetUrl);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 403 });
    }

    const body = await request.text();

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json',
        'User-Agent': 'ARK-Dumpster-Proxy/1.0',
      },
      body,
      // Security: Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    const data = await response.text();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
        // Restrictive CORS headers
        'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || 'https://arkdumpsterrentals.com',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timeout' }, { status: 408 });
    }
    return NextResponse.json({ error: 'Proxy request failed' }, { status: 500 });
  }
}
