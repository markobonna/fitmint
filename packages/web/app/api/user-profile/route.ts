import { NextRequest, NextResponse } from 'next/server';

// Mock user profile endpoint - in production, this would fetch from your database
export async function GET(request: NextRequest) {
  const userId = request.headers.get('X-User-Id');
  
  // In a real app, fetch user data from database
  // For now, return mock data for testing
  const mockVerified = userId !== 'anonymous';
  
  return NextResponse.json({
    verified: mockVerified,
    worldId: mockVerified ? `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}` : '',
    streak: 3,
    totalClaimed: 4.5,
    lastClaimDate: mockVerified ? new Date(Date.now() - 86400000).toISOString() : null, // yesterday
  });
}
