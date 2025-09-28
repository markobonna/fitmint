import { NextResponse } from 'next/server';
import { getMetrics } from '../../../lib/monitoring';

export async function GET() {
  try {
    const metrics = await getMetrics();
    
    return new Response(metrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error generating metrics:', error);
    return NextResponse.json(
      { error: 'Failed to generate metrics' },
      { status: 500 }
    );
  }
}

// Prevent caching of metrics endpoint
export const dynamic = 'force-dynamic';
export const revalidate = 0;