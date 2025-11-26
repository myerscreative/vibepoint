import { NextRequest, NextResponse } from 'next/server';
import { deleteAllMoodEntries } from '@/lib/db';
import { getCurrentUser } from '@/lib/supabase';

/**
 * DELETE /api/data/delete
 *
 * Delete all user mood data (GDPR right to deletion).
 * Requires confirmation token in request body.
 *
 * Request body:
 * {
 *   "confirmation": "DELETE ALL MY DATA"
 * }
 */
export async function DELETE(request: NextRequest) {
  try {
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
    const { confirmation } = body;

    // Require explicit confirmation
    if (confirmation !== 'DELETE ALL MY DATA') {
      return NextResponse.json(
        { error: 'Invalid confirmation. Please type "DELETE ALL MY DATA" exactly.' },
        { status: 400 }
      );
    }

    // Delete all mood entries
    const { error } = await deleteAllMoodEntries();

    if (error) {
      console.error('Error deleting mood entries:', error);
      return NextResponse.json(
        { error: 'Failed to delete data' },
        { status: 500 }
      );
    }

    // Success
    return NextResponse.json({
      success: true,
      message: 'All mood data has been permanently deleted',
      deletedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error deleting data:', error);
    return NextResponse.json(
      { error: 'Failed to delete data' },
      { status: 500 }
    );
  }
}
