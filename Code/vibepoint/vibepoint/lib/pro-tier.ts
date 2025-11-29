/**
 * Pro Tier Utilities - Client-Side
 *
 * Client-side functions for checking Pro tier access.
 * This file is safe to import in client components.
 */

import { ProTierStatus, getFreeTierStatus } from './pro-tier-shared';

// Re-export types for convenience
export type { ProTierStatus } from './pro-tier-shared';

/**
 * Client-side helper to check Pro status
 * Uses the API route to get subscription status
 */
export async function checkProStatusClient(): Promise<ProTierStatus> {
  try {
    const response = await fetch('/api/subscriptions/status');
    if (!response.ok) {
      return getFreeTierStatus();
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking Pro status (client):', error);
    return getFreeTierStatus();
  }
}
