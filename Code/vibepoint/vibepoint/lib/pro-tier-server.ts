/**
 * Pro Tier Utilities - Server-Side Only
 *
 * Server-side functions for checking Pro tier access.
 * This file should ONLY be imported in Server Components or API routes.
 */

import { createServerSupabaseClient } from '@/lib/supabase-server';
import { ProTierStatus, getFreeTierStatus, isSubscriptionActive } from './pro-tier-shared';

/**
 * Get user's Pro tier status from database
 * SERVER-SIDE ONLY - Use checkProStatusClient() in client components
 */
export async function checkProStatus(): Promise<ProTierStatus> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Not authenticated - return free tier
      return getFreeTierStatus();
    }

    // Fetch subscription from database
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('tier, status, subscription_end')
      .eq('user_id', user.id)
      .single();

    if (error || !subscription) {
      // No subscription record found - default to free tier
      // Create a free tier record for this user using upsert
      await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          tier: 'free',
          status: 'free',
        }, {
          onConflict: 'user_id'
        });

      return getFreeTierStatus();
    }

    // Check if subscription is active
    const isPro = 
      subscription.tier === 'premium' && 
      isSubscriptionActive(subscription.status, subscription.subscription_end);

    return {
      isPro,
      tier: subscription.tier as 'free' | 'premium',
      status: subscription.status as ProTierStatus['status'],
      features: {
        aiInsights: isPro, // Pro only
        emotionRecipes: isPro, // Pro only
        advancedPatterns: isPro, // Pro only
        exportData: isPro, // Pro only
      },
      limits: {
        recipesPerWeek: isPro ? 100 : 3,
        aiRequestsPerHour: isPro ? 50 : 5,
      },
    };
  } catch (error) {
    console.error('Error checking Pro status:', error);
    // On error, default to free tier for safety
    return getFreeTierStatus();
  }
}

