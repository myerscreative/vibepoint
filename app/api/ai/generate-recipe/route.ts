import { NextRequest, NextResponse } from 'next/server';
import { getMoodEntries } from '@/lib/db';
import { generateEmotionRecipe } from '@/lib/anthropic';
import { findBestStates, prepareEntriesForAI, checkRateLimit, trackAICost } from '@/lib/ai-utils';
import { getCurrentUser } from '@/lib/supabase';

/**
 * POST /api/ai/generate-recipe
 *
 * Generate a personalized emotion recipe based on user's best past states.
 * Pro tier feature only.
 *
 * Request body:
 * {
 *   "targetEmotion": "confident", // The emotion the user wants to feel
 *   "currentMood": { "happiness": 50, "motivation": 40 },
 *   "currentFocus": "upcoming presentation",
 *   "currentSelfTalk": "I'm worried",
 *   "currentPhysical": "tense shoulders"
 * }
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

    // Parse request body
    const body = await request.json();
    const {
      targetEmotion,
      currentMood,
      currentFocus,
      currentSelfTalk,
      currentPhysical,
    } = body;

    // Validate input
    if (!targetEmotion || !currentMood || !currentFocus || !currentSelfTalk || !currentPhysical) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Rate limiting: 10 recipes per week
    const rateLimit = checkRateLimit(user.id, 'generate-recipe', 10, 7 * 24 * 60 * 60 * 1000);
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

    if (entries.length < 5) {
      return NextResponse.json(
        { error: 'Need at least 5 mood entries to generate a recipe' },
        { status: 400 }
      );
    }

    // Find best states matching the target emotion
    const bestStates = findBestStates(entries, targetEmotion, 3);

    if (bestStates.length === 0) {
      return NextResponse.json(
        {
          error: `No past entries match "${targetEmotion}" state. Try logging more moods.`,
        },
        { status: 400 }
      );
    }

    // Prepare current state
    const currentState = {
      mood: currentMood,
      focus: currentFocus,
      selfTalk: currentSelfTalk,
      physical: currentPhysical,
    };

    // Generate recipe
    const { recipe, usage } = await generateEmotionRecipe(
      targetEmotion,
      bestStates,
      currentState
    );

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

    // Return recipe
    return NextResponse.json({
      success: true,
      recipe,
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
    console.error('Error generating recipe:', error);
    return NextResponse.json(
      { error: 'Failed to generate recipe' },
      { status: 500 }
    );
  }
}
