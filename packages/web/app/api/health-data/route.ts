import { NextRequest, NextResponse } from 'next/server';

// Mock health data endpoint - in production, this would connect to your database
// which receives data from the React Native companion app
export async function GET(request: NextRequest) {
  const userId = request.headers.get('X-User-Id');
  
  // In production, fetch from database
  // For now, return mock data that updates throughout the day
  const hour = new Date().getHours();
  const mockSteps = Math.min(hour * 800 + Math.random() * 500, 15000);
  const mockExercise = hour > 6 && hour < 9 ? 35 : hour > 17 && hour < 20 ? 25 : 0;
  
  return NextResponse.json({
    steps: Math.floor(mockSteps),
    exerciseMinutes: mockExercise,
    calories: Math.floor(mockSteps * 0.04),
    lastSync: new Date().toISOString(),
  });
}
