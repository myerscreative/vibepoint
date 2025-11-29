/**
 * Pro Tier Shared Types and Utilities
 *
 * Client-safe types and helper functions that can be used in both
 * client and server components.
 */

export interface ProTierStatus {
  isPro: boolean;
  tier: 'free' | 'premium';
  status: 'active' | 'cancelled' | 'expired' | 'trial' | 'free';
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
 * Check if a subscription is currently active
 */
export function isSubscriptionActive(
  status: string,
  subscriptionEnd: string | null
): boolean {
  if (status === 'active') {
    // Check if subscription hasn't expired
    if (!subscriptionEnd) {
      return true; // No end date means active indefinitely
    }
    return new Date(subscriptionEnd) > new Date();
  }
  return false;
}

/**
 * Get free tier status (default)
 */
export function getFreeTierStatus(): ProTierStatus {
  return {
    isPro: false,
    tier: 'free',
    status: 'free',
    features: {
      aiInsights: false,
      emotionRecipes: false,
      advancedPatterns: false,
      exportData: false,
    },
    limits: {
      recipesPerWeek: 3,
      aiRequestsPerHour: 5,
    },
  };
}

