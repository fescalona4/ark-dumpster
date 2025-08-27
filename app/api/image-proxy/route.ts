import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing image URL' }, { status: 400 });
    }

    // Validate that it's a Supabase URL for security
    if (!imageUrl.includes('supabase.co')) {
      return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
    }

    console.log('Proxying image:', imageUrl);

    // Simple fetch without proxy for now - since Supabase images are publicly accessible
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NextJS-ImageProxy/1.0)',
        'Accept': 'image/*,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      return NextResponse.json({
        error: `Failed to fetch image: ${response.status}`
      }, { status: response.status });
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    console.log(`Successfully proxied image: ${contentType}, ${imageBuffer.byteLength} bytes`);

    // Return the image without caching
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Length': imageBuffer.byteLength.toString(),
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json({
      error: 'Failed to proxy image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
