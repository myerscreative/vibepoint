import { createServerSupabaseClient } from '@/lib/supabase-server';
import { Recipe, RecipeInput, RecipeStep } from '@/types';

// Recipes (Pro tier) - New schema with recipe_steps

export async function createRecipe(recipe: RecipeInput): Promise<{ data: Recipe | null; error: any }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: new Error('Not authenticated') };
  }

  // Insert recipe
  const { data: recipeData, error: recipeError } = await supabase
    .from('recipes')
    .insert([
      {
        user_id: user.id,
        title: recipe.title,
        description: recipe.description,
        total_duration: recipe.total_duration,
        is_favorite: recipe.is_favorite || false,
      },
    ])
    .select()
    .single();

  if (recipeError || !recipeData) {
    return { data: null, error: recipeError };
  }

  // Insert recipe steps
  const stepsToInsert = recipe.steps.map((step, index) => ({
    recipe_id: recipeData.id,
    order_index: index + 1,
    title: step.title,
    description: step.description,
    duration: step.duration,
  }));

  const { error: stepsError } = await supabase
    .from('recipe_steps')
    .insert(stepsToInsert);

  if (stepsError) {
    // Rollback: delete the recipe if steps insertion fails
    await supabase.from('recipes').delete().eq('id', recipeData.id);
    return { data: null, error: stepsError };
  }

  // Fetch complete recipe with steps
  const { data: completeRecipe, error: fetchError } = await supabase
    .from('recipes')
    .select(`
      *,
      recipe_steps (*)
    `)
    .eq('id', recipeData.id)
    .single();

  return { data: completeRecipe as Recipe | null, error: fetchError };
}

export async function getRecipes(options: { 
  favoritesOnly?: boolean;
  limit?: number;
} = {}): Promise<{ data: Recipe[] | null; error: any }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: new Error('Not authenticated') };
  }
  
  let query = supabase
    .from('recipes')
    .select(`
      *,
      recipe_steps (*)
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (options.favoritesOnly) {
    query = query.eq('is_favorite', true);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  
  if (data) {
    // Sort steps by order_index
    data.forEach(recipe => {
      if (recipe.recipe_steps) {
        recipe.recipe_steps.sort((a: RecipeStep, b: RecipeStep) => a.order_index - b.order_index);
      }
    });
  }
  
  return { data: data as Recipe[] | null, error };
}

export async function getRecipe(id: string): Promise<{ data: Recipe | null; error: any }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: new Error('Not authenticated') };
  }
  
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      recipe_steps (*)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  
  if (data && data.recipe_steps) {
    // Sort steps by order_index
    data.recipe_steps.sort((a: RecipeStep, b: RecipeStep) => a.order_index - b.order_index);
  }
    
  return { data: data as Recipe | null, error };
}

export async function toggleRecipeFavorite(id: string, isFavorite: boolean): Promise<{ error: any }> {
  const supabase = await createServerSupabaseClient();
  
  const { error } = await supabase
    .from('recipes')
    .update({ 
      is_favorite: isFavorite,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
    
  return { error };
}

export async function deleteRecipe(id: string): Promise<{ error: any }> {
  const supabase = await createServerSupabaseClient();
  
  // Steps will be deleted automatically due to CASCADE
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id);
    
  return { error };
}
