'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/supabase';
import { Recipe } from '@/types';

export default function RecipesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [error, setError] = useState('');

  const loadRecipes = useCallback(async () => {
    const user = await getCurrentUser();
    if (!user) {
      router.push('/');
      return;
    }

    try {
      const params = new URLSearchParams();
      if (filter === 'favorites') {
        params.append('favoritesOnly', 'true');
      }

      const response = await fetch(`/api/recipes?${params}`);
      const data = await response.json();

      if (response.ok) {
        setRecipes(data.recipes || []);
      } else {
        setError(data.error || 'Failed to load recipes');
      }
    } catch (err) {
      setError('Failed to load recipes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter, router]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  const handleToggleFavorite = async (recipeId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: currentStatus ? 'unfavorite' : 'favorite',
        }),
      });

      if (response.ok) {
        // Refresh recipes
        await loadRecipes();
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!confirm('Delete this recipe? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadRecipes();
      }
    } catch (err) {
      console.error('Failed to delete recipe:', err);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-lg text-gray-700">Loading recipes...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Recipes</h1>
            <p className="text-gray-600 mt-1">
              Your personalized emotion recipes
              <span className="ml-2 text-xs bg-purple-600 text-white px-2 py-1 rounded-full">
                PRO
              </span>
            </p>
          </div>
          <Link
            href="/home"
            className="text-blue-600 hover:text-blue-700 font-medium transition-smooth"
          >
            ← Back
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-smooth ${
              filter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            All Recipes
          </button>
          <button
            onClick={() => setFilter('favorites')}
            className={`px-4 py-2 rounded-lg font-medium transition-smooth ${
              filter === 'favorites'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            ⭐ Favorites
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Recipes grid */}
        {recipes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-5xl mb-4">🧪</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No recipes yet
            </h2>
            <p className="text-gray-600 mb-6">
              {filter === 'favorites'
                ? "You haven't favorited any recipes yet"
                : 'Generate your first emotion recipe from the Patterns page'}
            </p>
            <Link
              href="/patterns"
              className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-smooth"
            >
              Go to Patterns
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-smooth"
              >
                {/* Recipe header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {recipe.title}
                    </h3>
                    <p className="text-sm text-purple-600 capitalize">
                      {recipe.target_emotion}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleFavorite(recipe.id, recipe.is_favorite)}
                    className="text-2xl hover:scale-110 transition-transform"
                  >
                    {recipe.is_favorite ? '⭐' : '☆'}
                  </button>
                </div>

                {/* Recipe stats */}
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                  <span>{recipe.steps.length} steps</span>
                  <span>•</span>
                  <span>{recipe.duration}</span>
                  {recipe.use_count > 0 && (
                    <>
                      <span>•</span>
                      <span>Used {recipe.use_count}x</span>
                    </>
                  )}
                </div>

                {/* Why this works */}
                <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                  {recipe.why_this_works}
                </p>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Link
                    href={`/recipe-player?id=${recipe.id}`}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-smooth text-center"
                  >
                    Play Recipe
                  </Link>
                  <button
                    onClick={() => handleDeleteRecipe(recipe.id)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-smooth"
                  >
                    🗑️
                  </button>
                </div>

                {/* Date created */}
                <p className="text-xs text-gray-500 mt-3">
                  Created {new Date(recipe.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Create new recipe CTA */}
        {recipes.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-200 rounded-xl p-6 text-center">
            <p className="text-purple-900 font-medium mb-3">
              Want to create a new recipe?
            </p>
            <Link
              href="/patterns"
              className="inline-block bg-white text-purple-600 px-6 py-3 rounded-xl font-medium hover:bg-purple-50 transition-smooth"
            >
              Generate from Patterns
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
