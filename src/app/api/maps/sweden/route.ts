import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const z = searchParams.get('z');
  const x = searchParams.get('x');
  const y = searchParams.get('y');
  const layer = searchParams.get('layer') || 'topowebb';

  // Log the incoming request parameters
  console.log('Incoming request:', { z, x, y, layer });

  const username = 'gardsh';
  const password = 'miknen-pybnac-2Temsa';
  const credentials = Buffer.from(`${username}:${password}`).toString('base64');

  // Construct the URL according to the WMTS specification
  const url = `https://api.lantmateriet.se/open/topowebb-ccby/v1/wmts/1.0.0/${layer}/default/3857/${z}/${y}/${x}.png`;
  
  console.log('Fetching URL:', url);

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'image/png',
        'User-Agent': 'MapViewer/1.0'
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      console.error('Server response error:', {
        status: response.status,
        statusText: response.statusText,
        url: url
      });

      // Try to get more error details if available
      const errorText = await response.text();
      console.error('Error response body:', errorText);

      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    
    // Log successful response
    console.log('Successfully fetched tile:', { z, x, y, layer, size: buffer.byteLength });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error: any) {
    console.error('Proxy error:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Error fetching map tile', 
        details: error.message || String(error),
        params: { z, x, y, layer }
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
} 