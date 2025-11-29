import { NextResponse } from 'next/server';
import { checkProStatus } from '@/lib/pro-tier-server';

/**
 * GET /api/subscriptions/status
 * 
 * Get current user's subscription status
 * Used by client-side components
 */
export async function GET() {
  try {
    const status = await checkProStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}

