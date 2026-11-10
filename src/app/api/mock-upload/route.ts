import { NextRequest, NextResponse } from 'next/server';

// Temporary in-memory cache for development image testing
const mockStorage = new Map<string, { buffer: ArrayBuffer; contentType: string }>();

// Pre-flight CORS support
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-amz-acl, Cache-Control',
    },
  });
}

// Emulates S3 Pre-signed URL PUT upload
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Missing object key' }, { status: 400 });
    }

    const contentType = req.headers.get('content-type') || 'image/jpeg';
    const buffer = await req.arrayBuffer();

    // Store in dev memory map (max 20 entries to prevent memory leak)
    if (mockStorage.size > 20) {
      const firstKey = mockStorage.keys().next().value;
      if (firstKey) mockStorage.delete(firstKey);
    }
    mockStorage.set(key, { buffer, contentType });

    // Emulate AWS S3 200 OK response on PUT
    return new NextResponse(null, {
      status: 200,
      headers: {
        'ETag': `"${Math.random().toString(36).substring(2, 14)}"`,
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Mock upload failed', details: error?.message },
      { status: 500 }
    );
  }
}

// Allows viewing the uploaded mock image in browser
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');

  if (key && mockStorage.has(key)) {
    const item = mockStorage.get(key)!;
    return new NextResponse(item.buffer, {
      status: 200,
      headers: {
        'Content-Type': item.contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  // Fallback placeholder SVG
  const fallbackSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <rect width="100%" height="100%" fill="#1e293b"/>
      <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="20">
        Shoe Angle Verified & Stored
      </text>
      <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="#38bdf8" font-family="monospace" font-size="14">
        ${key || 'S3 Object Key'}
      </text>
    </svg>
  `;

  return new NextResponse(fallbackSvg, {
    status: 200,
    headers: { 'Content-Type': 'image/svg+xml' },
  });
}
