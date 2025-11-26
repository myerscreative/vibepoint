import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase';
import { getRecipe, toggleRecipeFavorite, deleteRecipe, incrementRecipeUseCount } from '@/lib/db';

/**
 * GET /api/recipes/[id]
 *
 * Get a specific recipe
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data, error } = await getRecipe(params.id);

    if (error) {
      console.error('Error fetching recipe:', error);
      return NextResponse.json(
        { error: 'Failed to fetch recipe' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ recipe: data });
  } catch (error) {
    console.error('Error in GET /api/recipes/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/recipes/[id]
 *
 * Update recipe (favorite status, use count)
 * Body: { action: 'favorite' | 'unfavorite' | 'use' }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'favorite' || action === 'unfavorite') {
      const { data, error } = await toggleRecipeFavorite(
        params.id,
        action === 'favorite'
      );

      if (error) {
        console.error('Error updating favorite status:', error);
        return NextResponse.json(
          { error: 'Failed to update favorite status' },
          { status: 500 }
        );
      }

      return NextResponse.json({ recipe: data });
    }

    if (action === 'use') {
      const { error } = await incrementRecipeUseCount(params.id);

      if (error) {
        console.error('Error incrementing use count:', error);
        return NextResponse.json(
          { error: 'Failed to update use count' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in PATCH /api/recipes/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/recipes/[id]
 *
 * Delete a recipe
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { error } = await deleteRecipe(params.id);

    if (error) {
      console.error('Error deleting recipe:', error);
      return NextResponse.json(
        { error: 'Failed to delete recipe' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/recipes/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
