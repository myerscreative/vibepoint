/**
 * Pro Tier Utilities
 *
 * Functions for checking Pro tier access and limits.
 * For MVP, this is a simple stub. In production, integrate with Stripe.
 */

import { getCurrentUser } from './supabase';

export interface ProTierStatus {
  isPro: boolean;
  features: {
    aiInsights: boolean;
    emotionRecipes: boolean;
    advancedPatterns: boolean;
    exportData: boolean;
  };
  limits: {
    recipesPerWeek: number;
    aiRequestsPerHour: number;
  };
}

/**
 * Check if user has Pro tier access
 * For MVP: All users have Pro access (free beta)
 * TODO: Integrate with Stripe subscription status
 */
export async function checkProTierStatus(): Promise<ProTierStatus> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      isPro: false,
      features: {
        aiInsights: false,
        emotionRecipes: false,
        advancedPatterns: false,
        exportData: true, // Privacy feature - always available
      },
      limits: {
        recipesPerWeek: 0,
        aiRequestsPerHour: 0,
      },
    };
  }

  // MVP: All authenticated users have Pro access during beta
  // TODO: Check Stripe subscription status
  // const subscription = await checkStripeSubscription(user.id);

  return {
    isPro: true, // Free Pro access during beta
    features: {
      aiInsights: true,
      emotionRecipes: true,
      advancedPatterns: true,
      exportData: true,
    },
    limits: {
      recipesPerWeek: 10,
      aiRequestsPerHour: 10,
    },
  };
}

/**
 * Check if user has access to a specific Pro feature
 */
export async function hasProFeature(feature: keyof ProTierStatus['features']): Promise<boolean> {
  const status = await checkProTierStatus();
  return status.features[feature];
}

/**
 * Get Pro tier limits for user
 */
export async function getProLimits(): Promise<ProTierStatus['limits']> {
  const status = await checkProTierStatus();
  return status.limits;
}

/**
 * Middleware to protect Pro-only routes
 */
export async function requireProTier(): Promise<{ authorized: boolean; error?: string }> {
  const status = await checkProTierStatus();

  if (!status.isPro) {
    return {
      authorized: false,
      error: 'Pro tier subscription required',
    };
  }

  return { authorized: true };
}
