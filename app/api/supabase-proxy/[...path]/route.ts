import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Security: Only allow proxy in development environment
  if (process.env.NODE_ENV !== 'development') {
    console.warn('🚫 Proxy route accessed in production - blocking request');
    return NextResponse.json(
      { error: 'Proxy not available in production' },
      { status: 403 }
    );
  }

  try {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/supabase-proxy', '');
    const queryString = url.search;

    const targetUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}${path}${queryString}`;

    console.log('🔀 Proxying Supabase request:', targetUrl);
    console.log('🔧 Proxy settings:', {
      HTTP_PROXY: process.env.HTTP_PROXY,
      HTTPS_PROXY: process.env.HTTPS_PROXY,
      http_proxy: process.env.http_proxy,
      https_proxy: process.env.https_proxy,
    });

    // Use undici with proxy support for better corporate proxy support
    const proxyUrl =
      process.env.HTTPS_PROXY ||
      process.env.https_proxy ||
      process.env.HTTP_PROXY ||
      process.env.http_proxy;

    if (proxyUrl) {
      console.log('🔗 Using proxy:', proxyUrl);

      try {
        // Use undici with proxy dispatcher (for Node.js 18+)
        const { ProxyAgent, fetch: undiciFetch } = require('undici');
        const dispatcher = new ProxyAgent(proxyUrl);

        console.log('✅ Undici proxy agent configured');

        const response = await undiciFetch(targetUrl, {
          method: 'GET',
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          dispatcher: dispatcher,
        });

        const data = await response.text();
        console.log('✅ Undici request successful, status:', response.status);

        return new NextResponse(data, {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers':
              'Content-Type, Authorization, apikey, Prefer',
          },
        });
      } catch (error) {
        console.error('❌ Undici with proxy failed:', error);
        throw error;
      }
    } else {
      console.log('⚠️ No proxy configured, using direct connection');

      // Direct connection (no proxy)
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
      });

      const data = await response.text();

      return new NextResponse(data, {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers':
            'Content-Type, Authorization, apikey, Prefer',
        },
      });
    }
  } catch (error) {
    console.error('Supabase proxy error:', error);
    return NextResponse.json(
      {
        error: 'Failed to proxy request to Supabase',
        details: error instanceof Error ? error.message : 'Unknown error',
        proxy:
          process.env.HTTPS_PROXY ||
          process.env.HTTP_PROXY ||
          'No proxy configured',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Security: Only allow proxy in development environment
  if (process.env.NODE_ENV !== 'development') {
    console.warn('🚫 Proxy route accessed in production - blocking request');
    return NextResponse.json(
      { error: 'Proxy not available in production' },
      { status: 403 }
    );
  }

  try {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/supabase-proxy', '');
    const queryString = url.search;

    const targetUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}${path}${queryString}`;
    const body = await request.text();

    console.log('🔀 Proxying Supabase POST request:', targetUrl);

    const proxyUrl =
      process.env.HTTPS_PROXY ||
      process.env.https_proxy ||
      process.env.HTTP_PROXY ||
      process.env.http_proxy;

    if (proxyUrl) {
      try {
        const { ProxyAgent, fetch: undiciFetch } = require('undici');
        const dispatcher = new ProxyAgent(proxyUrl);

        const response = await undiciFetch(targetUrl, {
          method: 'POST',
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body,
          dispatcher: dispatcher,
        });

        const data = await response.text();

        return new NextResponse(data, {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers':
              'Content-Type, Authorization, apikey, Prefer',
          },
        });
      } catch (error) {
        throw error;
      }
    } else {
      // Direct connection
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body,
      });

      const data = await response.text();

      return new NextResponse(data, {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers':
            'Content-Type, Authorization, apikey, Prefer',
        },
      });
    }
  } catch (error) {
    console.error('Supabase proxy error:', error);
    return NextResponse.json(
      {
        error: 'Failed to proxy request to Supabase',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
