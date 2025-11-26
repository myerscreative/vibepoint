import { NextRequest, NextResponse } from 'next/server';
import { getMoodEntries } from '@/lib/db';
import { getCurrentUser } from '@/lib/supabase';

/**
 * GET /api/data/export
 *
 * Export all user data as JSON (GDPR compliance).
 * Returns complete mood entry history.
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all mood entries
    const entries = await getMoodEntries(user.id);

    // Prepare export data
    const exportData = {
      exportedAt: new Date().toISOString(),
      userId: user.id,
      userEmail: user.email,
      dataType: 'vibepoint-mood-data',
      version: '1.0',
      totalEntries: entries.length,
      entries: entries.map((entry) => ({
        id: entry.id,
        createdAt: entry.created_at,
        mood: {
          x: entry.mood_x,
          y: entry.mood_y,
          happiness: Math.round(100 - entry.mood_y),
          motivation: Math.round(entry.mood_x),
        },
        focus: entry.focus,
        selfTalk: entry.self_talk,
        physical: entry.physical,
        notes: entry.notes || null,
        sentiment: {
          focus: entry.focus_sentiment || null,
          selfTalk: entry.self_talk_sentiment || null,
          physical: entry.physical_sentiment || null,
          notes: entry.notes_sentiment || null,
          overall: entry.overall_sentiment || null,
        },
      })),
    };

    // Return as downloadable JSON file
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="vibepoint-data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
