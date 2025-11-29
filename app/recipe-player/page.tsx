'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Recipe } from '@/types';

// Sample recipe for prototype/demo
const sampleRecipe = {
  id: 'sample',
  title: "Your Confidence Recipe",
  target_emotion: "confident",
  duration: "60 seconds",
  steps: [
    {
      step: 1,
      focus: "Mental shift",
      instruction: "Recall a time when you felt fully prepared. Close your eyes and remember that feeling of 'I've got this.'",
      duration: 15,
    },
    {
      step: 2,
      focus: "Body adjustment",
      instruction: "Roll your shoulders back and down. Stand or sit tall. Take 3 deep breaths: 4 counts in, 6 counts out.",
      duration: 25,
    },
    {
      step: 3,
      focus: "Anchor",
      instruction: "Say out loud or in your mind: 'I know my material. I can handle whatever comes.' Feel your feet on the ground.",
      duration: 20,
    },
  ],
  why_this_works: "Your past entries show that confidence appears when you're breathing deeply, standing tall, and focusing on your preparation rather than outcomes.",
};

export default function RecipePlayerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recipeId = searchParams?.get('id');

  const [loading, setLoading] = useState(!!recipeId);
  const [recipe, setRecipe] = useState<Recipe | typeof sampleRecipe | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState('');

  const loadRecipe = useCallback(async () => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}`);
      const data = await response.json();

      if (response.ok) {
        setRecipe(data.recipe);
        // Track that recipe was used
        await fetch(`/api/recipes/${recipeId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'use' }),
        });
      } else {
        setError(data.error || 'Failed to load recipe');
        // Fallback to sample
        setRecipe(sampleRecipe);
      }
    } catch (err) {
      console.error('Failed to load recipe:', err);
      setError('Failed to load recipe');
      setRecipe(sampleRecipe);
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  useEffect(() => {
    if (recipeId && recipeId !== 'sample') {
      loadRecipe();
    } else {
      setRecipe(sampleRecipe);
      setLoading(false);
    }
  }, [recipeId, loadRecipe]);

  const currentStepData = recipe?.steps[currentStep];
  const totalSteps = recipe?.steps.length || 0;

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (isPlaying && timeLeft === 0) {
      // Move to next step
      if (currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1);
        setTimeLeft(recipe!.steps[currentStep + 1].duration);
      } else {
        // Recipe complete!
        setIsPlaying(false);
        setIsComplete(true);
      }
    }
  }, [isPlaying, timeLeft, currentStep, totalSteps, recipe]);

  const handleStart = () => {
    if (!currentStepData) return;
    setIsPlaying(true);
    setTimeLeft(currentStepData.duration);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setTimeLeft(0);
    setIsComplete(false);
  };

  const handleNext = () => {
    if (!recipe) return;
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      setTimeLeft(recipe.steps[currentStep + 1].duration);
      setIsPlaying(false);
    }
  };

  const handlePrevious = () => {
    if (!recipe) return;
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setTimeLeft(recipe.steps[currentStep - 1].duration);
      setIsPlaying(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-lg text-gray-700">Loading recipe...</div>
      </main>
    );
  }

  if (!recipe) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <p className="text-gray-700 mb-4">Recipe not found</p>
          <Link
            href="/recipes"
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            ← Back to Recipes
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{recipe.title}</h1>
            <p className="text-purple-600 font-medium mt-1">
              {recipe.duration} • {totalSteps} steps
              <span className="ml-2 text-xs bg-purple-600 text-white px-2 py-1 rounded-full">
                PRO
              </span>
            </p>
          </div>
          <Link
            href={recipeId && recipeId !== 'sample' ? '/recipes' : '/patterns'}
            className="text-gray-600 hover:text-gray-900 transition-smooth"
          >
            ✕
          </Link>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6 text-sm">
            {error} (Showing demo recipe)
          </div>
        )}

        {!isComplete ? (
          <>
            {/* Progress bar */}
            <div className="mb-8">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Step {currentStep + 1} of {totalSteps}</span>
                <span>{currentStepData?.focus}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                />
              </div>
            </div>

            {/* Main card */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
              {/* Timer circle */}
              <div className="flex justify-center mb-8">
                <div className="relative w-48 h-48">
                  {/* Background circle */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="#E5E7EB"
                      strokeWidth="8"
                      fill="none"
                    />
                    {/* Progress circle */}
                    {currentStepData && (
                      <circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke="url(#gradient)"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 88}`}
                        strokeDashoffset={`${
                          2 * Math.PI * 88 * (1 - (currentStepData.duration - timeLeft) / currentStepData.duration)
                        }`}
                        className="transition-all duration-1000"
                        strokeLinecap="round"
                      />
                    )}
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#9333EA" />
                        <stop offset="100%" stopColor="#EC4899" />
                      </linearGradient>
                    </defs>
                  </svg>
                  {/* Time display */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-gray-900">
                        {isPlaying ? timeLeft : currentStepData?.duration}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">seconds</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instruction */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {currentStepData?.focus}
                </h2>
                <p className="text-lg text-gray-700 leading-relaxed max-w-lg mx-auto">
                  {currentStepData?.instruction}
                </p>
              </div>

              {/* Controls */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-smooth"
                >
                  ← Previous
                </button>

                {!isPlaying ? (
                  <button
                    onClick={handleStart}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-smooth shadow-lg"
                  >
                    {timeLeft === 0 ? 'Start' : 'Resume'}
                  </button>
                ) : (
                  <button
                    onClick={handlePause}
                    className="px-8 py-3 bg-gray-700 text-white rounded-xl font-medium hover:bg-gray-800 transition-smooth"
                  >
                    Pause
                  </button>
                )}

                <button
                  onClick={handleNext}
                  disabled={currentStep === totalSteps - 1}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-smooth"
                >
                  Next →
                </button>
              </div>
            </div>

            {/* Why this works */}
            <div className="bg-purple-100 border border-purple-200 rounded-xl p-6">
              <h3 className="font-semibold text-purple-900 mb-2">
                💡 Why this works for you
              </h3>
              <p className="text-purple-800 text-sm">
                {recipe.why_this_works}
              </p>
            </div>
          </>
        ) : (
          /* Complete state */
          <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Recipe Complete!
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              How do you feel now? Take a moment to notice the shift.
            </p>

            <div className="space-y-4">
              <Link
                href="/mood/log"
                className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-smooth"
              >
                Log Your New State
              </Link>

              <button
                onClick={handleReset}
                className="block w-full bg-gray-100 text-gray-700 px-6 py-4 rounded-xl font-medium hover:bg-gray-200 transition-smooth"
              >
                Run Recipe Again
              </button>

              <Link
                href={recipeId && recipeId !== 'sample' ? '/recipes' : '/patterns'}
                className="block w-full text-purple-600 hover:text-purple-700 font-medium transition-smooth"
              >
                Back to {recipeId && recipeId !== 'sample' ? 'Recipes' : 'Patterns'}
              </Link>
            </div>
          </div>
        )}

        {/* Note about Pro feature */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            ✨ This is a <strong>Vibepoint Pro</strong> feature
          </p>
          <p className="mt-1">
            Recipes are generated from your personal data patterns
          </p>
        </div>
      </div>
    </main>
  );
}
