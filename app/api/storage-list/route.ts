import { NextRequest, NextResponse } from 'next/server';
import { ProxyAgent } from 'undici';

// Corporate proxy configuration
const proxyUrl = process.env.HTTP_PROXY || process.env.HTTPS_PROXY || 'http://proxy.ebiz.verizon.com:80';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const folder = searchParams.get('folder') || '';

  console.log(`🔀 Proxying Supabase storage list request for folder: "${folder}"`);

  try {
    // Build the Supabase storage list API URL
    // Use SERVICE ROLE key for listing (bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role key instead of anon key

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    // Try different API approaches
    // Method 1: Using the SDK-style POST endpoint
    const listUrl = `${supabaseUrl}/storage/v1/object/list/ark-bucket`;

    // Method 2: Let's also try the GET approach with query params
    const getUrl = `${supabaseUrl}/storage/v1/object/list/ark-bucket?limit=100&offset=0&sortBy=name&order=asc&search=${folder}`;

    console.log('🔗 Request URL (POST):', listUrl);
    console.log('🔗 Request URL (GET):', getUrl);

    const requestBody = JSON.stringify({
      limit: 100,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' },
      prefix: folder || undefined  // Try with undefined instead of empty string
    });

    console.log('📝 Request body:', requestBody);

    console.log('🔧 Proxy settings:', {
      HTTP_PROXY: process.env.HTTP_PROXY,
      HTTPS_PROXY: process.env.HTTPS_PROXY
    });

    console.log('🔗 Using proxy:', proxyUrl);

    // Create proxy agent
    const agent = new ProxyAgent(proxyUrl);
    console.log('✅ Undici proxy agent configured');

    // Try POST method first
    console.log('🚀 Trying POST method...');
    let response = await fetch(listUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseKey
      },
      body: requestBody,
      // @ts-ignore
      dispatcher: agent
    });

    console.log(`✅ POST request status: ${response.status}`);

    if (!response.ok) {
      console.log('❌ POST failed, trying GET method...');
      // Try GET method as fallback
      response = await fetch(getUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        },
        // @ts-ignore
        dispatcher: agent
      });

      console.log(`✅ GET request status: ${response.status}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Both methods failed:', errorText);
      return NextResponse.json(
        { error: `Storage list failed: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`📁 Raw response:`, JSON.stringify(data, null, 2));
    console.log(`📁 Found ${Array.isArray(data) ? data.length : 'non-array'} files in folder "${folder}"`);

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('💥 Proxy storage list error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
