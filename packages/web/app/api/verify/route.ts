import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, proof } = body;
  
  // In production: Verify proof with World ID backend
  // Store verification status in database
  
  console.log('Verification received for user:', userId);
  console.log('Proof:', proof);
  
  // Mock successful verification
  return NextResponse.json({
    success: true,
    verified: true,
    worldId: proof.merkle_root,
  });
}
