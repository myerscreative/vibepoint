import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getRecipes, createRecipe } from '@/lib/db';
import { RecipeInput } from '@/types';
import { checkProStatus } from '@/lib/pro-tier-server';

/**
 * GET /api/recipes
 *
 * Get user's saved recipes (Pro feature)
 * Query params:
 * - limit: number
 * - favoritesOnly: boolean
 * - targetEmotion: string
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check Pro status
    const proStatus = await checkProStatus();
    if (!proStatus.isPro) {
      return NextResponse.json(
        { error: 'Recipes are a Pro feature. Please upgrade to access.' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const favoritesOnly = searchParams.get('favoritesOnly') === 'true';

    const { data, error } = await getRecipes({
      limit,
      favoritesOnly,
    });

    if (error) {
      console.error('Error fetching recipes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch recipes' },
        { status: 500 }
      );
    }

    return NextResponse.json({ recipes: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/recipes
 *
 * Save a new recipe (Pro feature)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check Pro status
    const proStatus = await checkProStatus();
    if (!proStatus.isPro) {
      return NextResponse.json(
        { error: 'Recipe creation is a Pro feature. Please upgrade to access.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const recipeInput: RecipeInput = {
      title: body.title,
      description: body.description,
      total_duration: body.total_duration,
      steps: body.steps.map((step: any, index: number) => ({
        order_index: index + 1,
        title: step.title,
        description: step.description,
        duration: step.duration,
      })),
      is_favorite: body.is_favorite || false,
    };

    // Validate input
    if (!recipeInput.title || !recipeInput.description || !recipeInput.steps || recipeInput.steps.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate total_duration if not provided
    if (!recipeInput.total_duration) {
      recipeInput.total_duration = recipeInput.steps.reduce((sum, step) => sum + step.duration, 0);
    }

    const { data, error } = await createRecipe(recipeInput);

    if (error) {
      console.error('Error creating recipe:', error);
      return NextResponse.json(
        { error: 'Failed to create recipe' },
        { status: 500 }
      );
    }

    return NextResponse.json({ recipe: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
