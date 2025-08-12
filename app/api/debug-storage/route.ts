import { NextRequest, NextResponse } from 'next/server';
import { ProxyAgent } from 'undici';

// Corporate proxy configuration
const proxyUrl = process.env.HTTP_PROXY || process.env.HTTPS_PROXY || 'http://proxy.ebiz.verizon.com:80';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const folder = searchParams.get('folder') || '';

  console.log(`🔀 Trying different Supabase API approaches for folder: "${folder}"`);

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for listing

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const agent = new ProxyAgent(proxyUrl);

    // Try multiple approaches:
    const approaches = [
      {
        name: 'REST API with path',
        url: `${supabaseUrl}/rest/v1/objects?bucket_id=eq.ark-bucket&prefix=like.${folder}%25&select=*`,
        method: 'GET' as const,
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Accept': 'application/json'
        }
      },
      {
        name: 'Storage API with POST body',
        url: `${supabaseUrl}/storage/v1/object/list/ark-bucket`,
        method: 'POST' as const,
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' },
          prefix: folder
        })
      },
      {
        name: 'Storage API with GET params',
        url: `${supabaseUrl}/storage/v1/object/list/ark-bucket?limit=100&offset=0&prefix=${encodeURIComponent(folder)}`,
        method: 'GET' as const,
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        }
      }
    ];

    for (const approach of approaches) {
      console.log(`\n🧪 Trying: ${approach.name}`);
      console.log(`🔗 URL: ${approach.url}`);

      try {
        const response = await fetch(approach.url, {
          method: approach.method,
          headers: approach.headers,
          body: approach.body,
          // @ts-ignore
          dispatcher: agent
        });

        console.log(`📊 Status: ${response.status}`);

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ SUCCESS with ${approach.name}!`);
          console.log(`📁 Raw response:`, JSON.stringify(data, null, 2));

          if (Array.isArray(data) && data.length > 0) {
            console.log(`🎉 Found ${data.length} items!`);
            return NextResponse.json({
              method: approach.name,
              data: data,
              success: true
            });
          } else {
            console.log(`📭 No items found with ${approach.name}`);
          }
        } else {
          const errorText = await response.text();
          console.log(`❌ Failed with ${approach.name}: ${errorText}`);
        }
      } catch (error: any) {
        console.log(`💥 Error with ${approach.name}: ${error.message}`);
      }
    }

    return NextResponse.json({
      message: "All approaches tried",
      folder: folder,
      note: "Check server logs for detailed results"
    });

  } catch (error: any) {
    console.error('💥 Overall error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
