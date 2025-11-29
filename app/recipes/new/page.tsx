'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { RecipeInput } from '@/types'
import { ProBadge } from '@/components/ProBadge'
import { checkProStatusClient, ProTierStatus } from '@/lib/pro-tier'
import { UpgradeModal } from '@/components/UpgradeModal'

export default function NewRecipePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState<Array<{ title: string; description: string; duration: number }>>([
    { title: '', description: '', duration: 60 }
  ])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [proStatus, setProStatus] = useState<ProTierStatus | null>(null)
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false)
  const [showInfo, setShowInfo] = useState(true) // Show info card by default

  useEffect(() => {
    checkProAndLoad()
  }, [])

  const checkProAndLoad = async () => {
    const status = await checkProStatusClient()
    setProStatus(status)
    
    // Allow free users to see the page, but show upgrade modal
    // They can close it to see what the builder looks like
    if (!status.isPro) {
      // Don't auto-open - let them see the page
      // setIsUpgradeOpen(true)
    }
  }

  const addStep = () => {
    setSteps([...steps, { title: '', description: '', duration: 60 }])
  }

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index))
    }
  }

  const updateStep = (index: number, field: 'title' | 'description' | 'duration', value: string | number) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    setSteps(newSteps)
  }

  const calculateTotalDuration = () => {
    return steps.reduce((total, step) => total + (step.duration || 0), 0)
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) {
      return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
    }
    return `${secs}s`
  }

  const handleSave = async () => {
    setError('')

    // Validation
    if (!title.trim()) {
      setError('Please enter a recipe title')
      return
    }

    if (!description.trim()) {
      setError('Please enter a recipe description')
      return
    }

    const validSteps = steps.filter(step => step.title.trim() && step.description.trim())
    if (validSteps.length === 0) {
      setError('Please add at least one step with a title and description')
      return
    }

    setIsSaving(true)

    try {
      const recipeInput: RecipeInput = {
        title: title.trim(),
        description: description.trim(),
        total_duration: calculateTotalDuration(),
        steps: validSteps.map((step, index) => ({
          order_index: index + 1,
          title: step.title.trim(),
          description: step.description.trim(),
          duration: step.duration || 60,
        })),
      }

      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipeInput),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create recipe')
      }

      // Redirect to recipes page
      router.push('/recipes')
    } catch (err: any) {
      console.error('Error creating recipe:', err)
      setError(err.message || 'Failed to create recipe. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div 
      className="min-h-screen pb-24"
      style={{ 
        background: 'linear-gradient(45deg, #A855F7 0%, #EC4899 50%, #F97316 100%)',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="relative z-10 mx-auto max-w-[600px] px-5 py-6 md:px-6">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/recipes"
              className="flex items-center gap-2 rounded-[24px] border-2 border-black/10 bg-white px-4 py-2 text-sm font-medium text-[#1a1a2e] transition-colors hover:bg-gray-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </Link>
            <h1 
              className="font-serif text-[32px] font-semibold text-white"
              style={{ fontFamily: 'var(--font-fraunces)' }}
            >
              New Recipe
            </h1>
          </div>
          <ProBadge size="md" />
        </header>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-[20px] bg-red-50 border-2 border-red-200 p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* What are Recipes? Info Card */}
        {showInfo && (
          <div className="mb-6 rounded-[20px] bg-white/95 backdrop-blur-sm p-6 shadow-[0_2px_16px_rgba(0,0,0,0.08)] border-2 border-white/50 relative">
            <button
              onClick={() => setShowInfo(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 transition-colors"
              aria-label="Close info"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex items-start gap-4 pr-8">
              <div className="flex-shrink-0 text-4xl">💡</div>
              <div className="flex-1">
                <h2 className="mb-2 font-serif text-lg font-semibold text-[#1a1a2e]">
                  What are Mood Recipes?
                </h2>
                <p className="mb-3 text-sm text-[#4a4a6a] leading-relaxed">
                  Recipes are step-by-step routines you create to shift your emotional state. 
                  When you notice a pattern (like "when I focus on X and tell myself Y, I feel better"), 
                  turn it into a recipe you can use anytime.
                </p>
                <div className="space-y-2 text-xs text-[#4a4a6a] mb-3">
                  <p className="font-semibold text-[#1a1a2e]">Example recipe steps:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>"Take 3 deep breaths" (30 seconds)</li>
                    <li>"Shift focus to one small task" (2 minutes)</li>
                    <li>"Tell yourself: 'I can handle the next 10 minutes'" (1 minute)</li>
                  </ul>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-[#4a4a6a]">
                    <strong className="text-[#1a1a2e]">Tip:</strong> Look at your patterns page to see what's worked for you, then create recipes based on those insights!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Show Info Button (if hidden) */}
        {!showInfo && (
          <button
            onClick={() => setShowInfo(true)}
            className="mb-6 w-full rounded-[20px] bg-white/95 backdrop-blur-sm p-4 text-left shadow-[0_2px_16px_rgba(0,0,0,0.08)] border-2 border-white/50 hover:bg-white transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">💡</span>
              <span className="text-sm font-semibold text-[#1a1a2e]">What are Mood Recipes?</span>
              <span className="ml-auto text-xs text-[#718096]">Click to learn</span>
            </div>
          </button>
        )}

        {/* Recipe Form */}
        <div className="space-y-6">
          {/* Title */}
          <div className="rounded-[20px] bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.08)]">
            <label className="block mb-2 text-sm font-semibold text-[#1a1a2e]">
              Recipe Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Quick Reset, Morning Boost, Afternoon Slump Fix"
              className="w-full rounded-[16px] border-2 border-gray-200 px-4 py-3 text-[#1a1a2e] focus:border-pro-primary focus:outline-none transition-colors"
            />
            <p className="mt-2 text-xs text-[#718096]">
              Give your recipe a memorable name that describes when to use it
            </p>
          </div>

          {/* Description */}
          <div className="rounded-[20px] bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.08)]">
            <label className="block mb-2 text-sm font-semibold text-[#1a1a2e]">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe when and why to use this recipe... (e.g., 'Use when feeling overwhelmed at work' or 'Perfect for morning energy boost')"
              rows={3}
              className="w-full rounded-[16px] border-2 border-gray-200 px-4 py-3 text-[#1a1a2e] focus:border-pro-primary focus:outline-none transition-colors resize-none"
            />
            <p className="mt-2 text-xs text-[#718096]">
              Help yourself remember when this recipe is most helpful
            </p>
          </div>

          {/* Steps */}
          <div className="rounded-[20px] bg-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.08)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-[#1a1a2e]">
                  Steps *
                </label>
                <p className="mt-1 text-xs text-[#718096]">
                  Break down your mood shift into actionable steps
                </p>
              </div>
              <button
                type="button"
                onClick={addStep}
                className="rounded-full bg-gradient-to-r from-pro-primary to-pro-secondary px-4 py-2 text-sm font-semibold text-white shadow-md transition-transform hover:scale-105"
              >
                + Add Step
              </button>
            </div>

            <div className="space-y-4">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="rounded-[16px] border-2 border-gray-200 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#4a4a6a]">
                      Step {index + 1}
                    </span>
                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block mb-1 text-xs font-medium text-[#4a4a6a]">
                        Step Title *
                      </label>
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => updateStep(index, 'title', e.target.value)}
                        placeholder="e.g., Take 3 deep breaths, Shift focus, Stand and stretch"
                        className="w-full rounded-[12px] border border-gray-200 px-3 py-2 text-sm text-[#1a1a2e] focus:border-pro-primary focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-xs font-medium text-[#4a4a6a]">
                        Instructions *
                      </label>
                      <textarea
                        value={step.description}
                        onChange={(e) => updateStep(index, 'description', e.target.value)}
                        placeholder="What exactly should you do? Be specific. (e.g., 'Breathe in for 4 counts, hold for 4, exhale for 6. Repeat 3 times.')"
                        rows={2}
                        className="w-full rounded-[12px] border border-gray-200 px-3 py-2 text-sm text-[#1a1a2e] focus:border-pro-primary focus:outline-none transition-colors resize-none"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-xs font-medium text-[#4a4a6a]">
                        Duration (seconds) *
                      </label>
                      <input
                        type="number"
                        value={step.duration}
                        onChange={(e) => updateStep(index, 'duration', parseInt(e.target.value) || 60)}
                        min="1"
                        className="w-full rounded-[12px] border border-gray-200 px-3 py-2 text-sm text-[#1a1a2e] focus:border-pro-primary focus:outline-none transition-colors"
                      />
                      <p className="mt-1 text-xs text-[#718096]">
                        {formatDuration(step.duration || 60)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Duration */}
          <div className="rounded-[20px] bg-gradient-to-br from-[#fff5f8] to-white p-6 shadow-[0_2px_16px_rgba(0,0,0,0.08)] border-2 border-pro-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#1a1a2e]">
                Total Duration
              </span>
              <span className="font-display text-xl font-semibold text-pro-primary">
                {formatDuration(calculateTotalDuration())}
              </span>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-3">
            <Link
              href="/recipes"
              className="flex-1 rounded-[24px] border-2 border-black/10 bg-white px-6 py-3 text-center text-sm font-semibold text-[#1a1a2e] transition-colors hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 rounded-[24px] bg-gradient-to-r from-pro-primary to-pro-secondary px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(168,85,247,0.3)] transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Recipe'}
            </button>
          </div>
        </div>

        {/* Upgrade Modal */}
        <UpgradeModal
          isOpen={isUpgradeOpen}
          onClose={() => {
            setIsUpgradeOpen(false)
            if (!proStatus?.isPro) {
              router.push('/recipes')
            }
          }}
        />
      </div>
    </div>
  )
}

