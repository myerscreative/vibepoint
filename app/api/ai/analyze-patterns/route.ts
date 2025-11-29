import { NextRequest, NextResponse } from 'next/server';
import { getMoodEntries } from '@/lib/db';
import { generatePatternInsights } from '@/lib/anthropic';
import { extractPatternsForAI, checkRateLimit, trackAICost } from '@/lib/ai-utils';
import { getCurrentUser } from '@/lib/supabase';

/**
 * POST /api/ai/analyze-patterns
 *
 * Generate AI-powered insights from user's mood patterns.
 * Pro tier feature only.
 */
export async function POST(request: NextRequest) {
  try {
    // Check if AI features are enabled
    const aiEnabled = process.env.AI_FEATURES_ENABLED === 'true';
    if (!aiEnabled) {
      return NextResponse.json(
        { error: 'AI features are not enabled' },
        { status: 503 }
      );
    }

    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Check if user has Pro tier subscription
    // For now, we'll allow all authenticated users
    // In production, add:
    // const userSubscription = await getSubscription(user.id);
    // if (userSubscription.tier !== 'pro') {
    //   return NextResponse.json(
    //     { error: 'Pro subscription required' },
    //     { status: 403 }
    //   );
    // }

    // Rate limiting
    const rateLimit = checkRateLimit(user.id, 'analyze-patterns', 7, 7 * 24 * 60 * 60 * 1000); // 7 per week
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          resetAt: new Date(rateLimit.resetAt).toISOString(),
        },
        { status: 429 }
      );
    }

    // Get user's mood entries
    const entries = await getMoodEntries(user.id);

    if (entries.length < 10) {
      return NextResponse.json(
        { error: 'Need at least 10 mood entries for AI insights' },
        { status: 400 }
      );
    }

    // Extract patterns for AI
    const patterns = extractPatternsForAI(entries);

    // Generate insights
    const { insights, usage } = await generatePatternInsights(patterns);

    // Track cost
    const costTracking = trackAICost(user.id, usage.estimatedCostUSD);
    if (!costTracking.withinBudget) {
      return NextResponse.json(
        {
          error: 'Monthly AI budget exceeded',
          totalCost: costTracking.totalCost,
        },
        { status: 429 }
      );
    }

    // Return insights
    return NextResponse.json({
      success: true,
      insights,
      usage: {
        tokens: usage.totalTokens,
        cost: usage.estimatedCostUSD,
      },
      rateLimit: {
        remaining: rateLimit.remaining,
        resetAt: new Date(rateLimit.resetAt).toISOString(),
      },
    });
  } catch (error) {
    console.error('Error generating AI insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
