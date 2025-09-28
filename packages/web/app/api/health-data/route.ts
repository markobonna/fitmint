import { NextRequest, NextResponse } from 'next/server';

// Define health data interface
interface HealthData {
  steps: number;
  exerciseMinutes: number;
  calories: number;
  lastSync: string;
}

// Mock health data for demo users
const MOCK_USER_HEALTH: Record<string, HealthData> = {
  'new-user': {
    steps: 2543,
    exerciseMinutes: 8,
    calories: 102,
    lastSync: new Date().toISOString(),
  },
  'verified-user': {
    steps: 7821,
    exerciseMinutes: 22,
    calories: 313,
    lastSync: new Date().toISOString(),
  },
  'active-streak': {
    steps: 12437,
    exerciseMinutes: 45,
    calories: 498,
    lastSync: new Date().toISOString(),
  },
  'claimed-today': {
    steps: 11245,
    exerciseMinutes: 38,
    calories: 450,
    lastSync: new Date().toISOString(),
  }
};

// Mock health data endpoint - in production, this would connect to your database
// which receives data from the React Native companion app
export async function GET(request: NextRequest) {
  const userId = request.headers.get('X-User-Id');
  const mockUser = request.nextUrl.searchParams.get('mockUser');
  
  // If a specific mock user is requested, return their health data
  if (mockUser && MOCK_USER_HEALTH[mockUser]) {
    return NextResponse.json(MOCK_USER_HEALTH[mockUser]);
  }
  
  // Default behavior - random data based on time of day
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
