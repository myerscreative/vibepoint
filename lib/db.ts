import { supabase } from './supabase';
import { MoodEntry, MoodEntryInput, Recipe, RecipeInput } from '@/types';

// Mood entries
export async function createMoodEntry(entry: MoodEntryInput): Promise<{ data: MoodEntry | null; error: any }> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: new Error('Not authenticated') };
  }

  const { data, error } = await supabase
    .from('mood_entries')
    .insert([
      {
        user_id: user.id,
        ...entry,
      },
    ])
    .select()
    .single();

  return { data, error };
}

export async function getMoodEntries(limit?: number): Promise<{ data: MoodEntry[] | null; error: any }> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: new Error('Not authenticated') };
  }

  let query = supabase
    .from('mood_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  return { data, error };
}

export async function getMoodEntry(id: string): Promise<{ data: MoodEntry | null; error: any }> {
  const { data, error } = await supabase
    .from('mood_entries')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
}

export async function updateMoodEntry(id: string, updates: Partial<MoodEntryInput>): Promise<{ data: MoodEntry | null; error: any }> {
  const { data, error } = await supabase
    .from('mood_entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

export async function deleteMoodEntry(id: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from('mood_entries')
    .delete()
    .eq('id', id);

  return { error };
}

export async function deleteAllMoodEntries(): Promise<{ error: any }> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: new Error('Not authenticated') };
  }

  const { error } = await supabase
    .from('mood_entries')
    .delete()
    .eq('user_id', user.id);

  return { error };
}

// User preferences
export async function hasCompletedOnboarding(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  const { data } = await supabase
    .from('user_preferences')
    .select('onboarding_completed')
    .eq('user_id', user.id)
    .single();

  return data?.onboarding_completed || false;
}

export async function setOnboardingCompleted(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from('user_preferences')
    .upsert({
      user_id: user.id,
      onboarding_completed: true,
    });
}

// Recipes (Pro tier)
export async function createRecipe(recipe: RecipeInput): Promise<{ data: Recipe | null; error: any }> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: new Error('Not authenticated') };
  }

  const { data, error } = await supabase
    .from('recipes')
    .insert([
      {
        user_id: user.id,
        ...recipe,
      },
    ])
    .select()
    .single();

  return { data, error };
}

export async function getRecipes(options?: {
  limit?: number;
  favoritesOnly?: boolean;
  targetEmotion?: string;
}): Promise<{ data: Recipe[] | null; error: any }> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: new Error('Not authenticated') };
  }

  let query = supabase
    .from('recipes')
    .select('*')
    .eq('user_id', user.id);

  if (options?.favoritesOnly) {
    query = query.eq('is_favorite', true);
  }

  if (options?.targetEmotion) {
    query = query.eq('target_emotion', options.targetEmotion);
  }

  query = query.order('created_at', { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  return { data, error };
}

export async function getRecipe(id: string): Promise<{ data: Recipe | null; error: any }> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
}

export async function toggleRecipeFavorite(id: string, isFavorite: boolean): Promise<{ data: Recipe | null; error: any }> {
  const { data, error } = await supabase
    .from('recipes')
    .update({ is_favorite: isFavorite })
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

export async function incrementRecipeUseCount(id: string): Promise<{ error: any }> {
  const { error } = await supabase.rpc('increment_recipe_use', { recipe_id: id });

  // Fallback if RPC doesn't exist
  if (error) {
    const { data: recipe } = await getRecipe(id);
    if (recipe) {
      return await supabase
        .from('recipes')
        .update({
          use_count: recipe.use_count + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', id)
        .then(() => ({ error: null }))
        .catch((e) => ({ error: e }));
    }
  }

  return { error };
}

export async function deleteRecipe(id: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id);

  return { error };
}
