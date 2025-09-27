import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, steps, exerciseMinutes } = body;
  
  // Validate claim eligibility
  if (steps < 10000 && exerciseMinutes < 30) {
    return NextResponse.json(
      { error: 'Goals not met' },
      { status: 400 }
    );
  }
  
  // In production: 
  // 1. Check if already claimed today
  // 2. Verify with smart contract
  // 3. Record claim in database
  
  return NextResponse.json({
    success: true,
    amount: 1.0, // WLD
    reference: `claim-${userId}-${Date.now()}` ,
    transactionHash: '0x' + Math.random().toString(36).substring(7),
  });
}
