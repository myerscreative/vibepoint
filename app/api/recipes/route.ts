import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase';
import { getRecipes, createRecipe } from '@/lib/db';
import { RecipeInput } from '@/types';

/**
 * GET /api/recipes
 *
 * Get user's saved recipes
 * Query params:
 * - limit: number
 * - favoritesOnly: boolean
 * - targetEmotion: string
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const favoritesOnly = searchParams.get('favoritesOnly') === 'true';
    const targetEmotion = searchParams.get('targetEmotion') || undefined;

    const { data, error } = await getRecipes({
      limit,
      favoritesOnly,
      targetEmotion,
    });

    if (error) {
      console.error('Error fetching recipes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch recipes' },
        { status: 500 }
      );
    }

    return NextResponse.json({ recipes: data || [] });
  } catch (error) {
    console.error('Error in GET /api/recipes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/recipes
 *
 * Save a new recipe
 * Body: RecipeInput
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: RecipeInput = await request.json();

    // Validate input
    if (!body.title || !body.target_emotion || !body.steps || !body.why_this_works) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.steps) || body.steps.length === 0) {
      return NextResponse.json(
        { error: 'Steps must be a non-empty array' },
        { status: 400 }
      );
    }

    const { data, error } = await createRecipe(body);

    if (error) {
      console.error('Error creating recipe:', error);
      return NextResponse.json(
        { error: 'Failed to save recipe' },
        { status: 500 }
      );
    }

    return NextResponse.json({ recipe: data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/recipes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
