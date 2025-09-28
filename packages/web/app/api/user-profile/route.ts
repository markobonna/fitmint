import { NextRequest, NextResponse } from 'next/server';

// Define user profile type
interface UserProfileData {
  name: string;
  verified: boolean;
  worldId: string;
  streak: number;
  totalClaimed: number;
  lastClaimDate: string | null;
  description: string;
}

// Define mock users type with string keys
type MockUserMap = {
  [key: string]: UserProfileData;
};

// Collection of mock users for demo purposes
const MOCK_USERS: MockUserMap = {
  'new-user': {
    name: 'New User',
    verified: false,
    worldId: '',
    streak: 0,
    totalClaimed: 0,
    lastClaimDate: null,
    description: 'Just installed the app, not yet verified'
  },
  'verified-user': {
    name: 'Verified User',
    verified: true,
    worldId: `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    streak: 3,
    totalClaimed: 3.5,
    lastClaimDate: new Date(Date.now() - 86400000).toISOString(), // yesterday
    description: 'Regular user who has claimed rewards before'
  },
  'active-streak': {
    name: 'Fitness Enthusiast',
    verified: true,
    worldId: `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    streak: 15,
    totalClaimed: 17.5,
    lastClaimDate: new Date(Date.now() - 86400000).toISOString(), // yesterday
    description: 'Dedicated user with a long streak'
  },
  'claimed-today': {
    name: 'Already Claimed',
    verified: true,
    worldId: `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    streak: 7,
    totalClaimed: 8,
    lastClaimDate: new Date().toISOString(), // today
    description: 'User who already claimed their reward today'
  }
};

// List of available mock users for selection
export const AVAILABLE_MOCK_USERS = Object.entries(MOCK_USERS).map(([id, user]) => ({
  id,
  name: user.name,
  description: user.description
}));

// Interface for the user selection
export interface MockUserSelection {
  id: string;
  name: string;
  description: string;
}

// Mock user profile endpoint - in production, this would fetch from your database
export async function GET(request: NextRequest) {
  const userId = request.headers.get('X-User-Id');
  const mockUser = request.nextUrl.searchParams.get('mockUser');
  
  // If the request is asking for the list of available mock users
  if (request.nextUrl.searchParams.get('listMockUsers') === 'true') {
    return NextResponse.json({ availableMockUsers: AVAILABLE_MOCK_USERS });
  }
  
  // If a specific mock user is requested, return their profile
  if (mockUser && MOCK_USERS[mockUser]) {
    return NextResponse.json(MOCK_USERS[mockUser]);
  }
  
  // Default behavior
  const mockVerified = userId !== 'anonymous';
  
  return NextResponse.json({
    verified: mockVerified,
    worldId: mockVerified ? `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}` : '',
    streak: 3,
    totalClaimed: 4.5,
    lastClaimDate: mockVerified ? new Date(Date.now() - 86400000).toISOString() : null, // yesterday
  });
}
