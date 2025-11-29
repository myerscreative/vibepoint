import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getRecipe, toggleRecipeFavorite, deleteRecipe } from '@/lib/db';
import { checkProStatus } from '@/lib/pro-tier-server';

/**
 * GET /api/recipes/[id]
 *
 * Get a specific recipe (Pro feature)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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
    const { data, error } = await getRecipe(id);

    if (error || !data) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (data.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
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

/**
 * PATCH /api/recipes/[id]
 *
 * Update a recipe (favorite status, usage count) - Pro feature
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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
    const body = await request.json();
    const { action } = body;

    if (action === 'favorite') {
      const { isFavorite } = body;
      const { error } = await toggleRecipeFavorite(id, isFavorite);
      if (error) throw error;
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating recipe:', error);
    return NextResponse.json(
      { error: 'Failed to update recipe' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/recipes/[id]
 *
 * Delete a recipe (Pro feature)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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
    const { error } = await deleteRecipe(id);

    if (error) {
      console.error('Error deleting recipe:', error);
      return NextResponse.json(
        { error: 'Failed to delete recipe' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
