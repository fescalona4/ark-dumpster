import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  // Security: Only allow proxy testing in development environment
  if (process.env.NODE_ENV !== 'development') {
    console.warn('🚫 Test proxy route accessed in production - blocking request');
    return NextResponse.json(
      { error: 'Test proxy not available in production' },
      { status: 403 }
    );
  }

  try {
    console.log('🧪 Testing proxy connection...');
    
    // Try to make a request through our proxy
    const proxyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/supabase-proxy`;
    const testUrl = `${proxyUrl}/rest/v1/quotes?select=*&limit=1`;
    
    console.log('🔗 Test URL:', testUrl);
    console.log('🔧 Proxy environment:', {
      HTTP_PROXY: process.env.HTTP_PROXY,
      HTTPS_PROXY: process.env.HTTPS_PROXY,
      NODE_ENV: process.env.NODE_ENV
    });
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.text();
    console.log('✅ Proxy test result:', response.status, result.substring(0, 200));
    
    return NextResponse.json({
      success: true,
      status: response.status,
      proxy: proxyUrl,
      environment: process.env.NODE_ENV,
      hasProxy: !!(process.env.HTTP_PROXY || process.env.HTTPS_PROXY),
      result: result.substring(0, 500) // Truncate result for display
    });
    
  } catch (error) {
    console.error('❌ Proxy test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV,
      hasProxy: !!(process.env.HTTP_PROXY || process.env.HTTPS_PROXY),
      stack: error instanceof Error ? error.stack : 'No stack'
    }, { status: 500 });
  }
}
