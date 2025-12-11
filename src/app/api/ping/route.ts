import { NextResponse } from 'next/server';

/**
 * GET/HEAD /api/ping
 * 
 * Simple endpoint for latency testing.
 * Returns minimal response for accurate timing.
 */
export async function GET() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
