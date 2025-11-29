import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * DEV ONLY: Set current user as Pro
 * This route should be removed or protected in production
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Set user as Pro (premium tier, active status)
    const { error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: user.id,
        tier: 'premium',
        status: 'active',
        subscription_start: new Date().toISOString(),
        // Set subscription_end far in the future
        subscription_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error setting Pro status:', error);
      return NextResponse.json(
        { error: 'Failed to set Pro status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'You are now set as Pro! Refresh the page to see changes.'
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DEV ONLY: Remove Pro status (set back to free)
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Set user back to free tier
    const { error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: user.id,
        tier: 'free',
        status: 'free',
        subscription_start: null,
        subscription_end: null,
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error removing Pro status:', error);
      return NextResponse.json(
        { error: 'Failed to remove Pro status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'You are now set as Free tier. Refresh the page to see changes.'
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

