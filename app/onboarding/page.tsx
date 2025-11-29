'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setOnboardingCompleted } from '@/lib/db';

export default function OnboardingPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < 2) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = async () => {
    await setOnboardingCompleted();
    router.push('/home');
  };

  const handleComplete = async () => {
    await setOnboardingCompleted();
    router.push('/home');
  };

  const slides = [
    {
      title: "Every mood has 3 controllable inputs",
      description: "Focus, self-talk, and body. Change these, and you change how you feel.",
      visual: (
        <div className="max-w-md mx-auto space-y-6">
          {/* Three inputs visualization */}
          <div className="bg-gradient-to-r from-blue-100 to-blue-50 rounded-2xl p-6 border-2 border-blue-300">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">🎯</div>
              <div>
                <h3 className="font-semibold text-blue-900">1. What you focus on</h3>
                <p className="text-sm text-blue-700">Where your attention goes</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-100 to-purple-50 rounded-2xl p-6 border-2 border-purple-300">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">💭</div>
              <div>
                <h3 className="font-semibold text-purple-900">2. What you tell yourself</h3>
                <p className="text-sm text-purple-700">Your inner voice</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-100 to-green-50 rounded-2xl p-6 border-2 border-green-300">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">🧘</div>
              <div>
                <h3 className="font-semibold text-green-900">3. What your body is doing</h3>
                <p className="text-sm text-green-700">Posture, breathing, tension</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "From anxious → calm in 60 seconds",
      description: "Here's how it works. You control all three inputs.",
      visual: (
        <div className="max-w-md mx-auto space-y-6">
          {/* Before state */}
          <div className="bg-red-50 rounded-2xl p-6 border-2 border-red-200">
            <div className="text-center mb-4">
              <span className="text-2xl">😰</span>
              <p className="font-semibold text-red-900 mt-2">Feeling Anxious</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-start space-x-2">
                <span>🎯</span>
                <span className="text-red-800">Focusing on: <em>&quot;Everything that could go wrong&quot;</em></span>
              </div>
              <div className="flex items-start space-x-2">
                <span>💭</span>
                <span className="text-red-800">Telling yourself: <em>&quot;I can&apos;t handle this&quot;</em></span>
              </div>
              <div className="flex items-start space-x-2">
                <span>🧘</span>
                <span className="text-red-800">Body: <em>Shallow breathing, tight shoulders</em></span>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="text-center">
            <div className="text-4xl">↓</div>
            <p className="text-xs text-gray-600 font-medium mt-1">Shift all three</p>
          </div>

          {/* After state */}
          <div className="bg-green-50 rounded-2xl p-6 border-2 border-green-200">
            <div className="text-center mb-4">
              <span className="text-2xl">😌</span>
              <p className="font-semibold text-green-900 mt-2">Feeling Calm</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-start space-x-2">
                <span>🎯</span>
                <span className="text-green-800">Focusing on: <em>&quot;What I can control right now&quot;</em></span>
              </div>
              <div className="flex items-start space-x-2">
                <span>💭</span>
                <span className="text-green-800">Telling yourself: <em>&quot;One step at a time&quot;</em></span>
              </div>
              <div className="flex items-start space-x-2">
                <span>🧘</span>
                <span className="text-green-800">Body: <em>Deep breaths, shoulders relaxed</em></span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Track your 3 inputs daily",
      description: "Tap the gradient, answer 3 questions. Vibepoint learns your personal patterns and shows you what works.",
      visual: (
        <div className="max-w-md mx-auto space-y-6">
          {/* Gradient preview */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden mood-gradient shadow-xl border-2 border-blue-300">
            <div className="absolute top-1/3 right-1/3 w-10 h-10 bg-white bg-opacity-60 rounded-full flex items-center justify-center animate-pulse">
              <div className="w-5 h-5 bg-white rounded-full"></div>
            </div>

            {/* Axis labels */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-white text-xs font-medium px-2 py-1 bg-black bg-opacity-30 rounded-full">
              Happy
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white text-xs font-medium px-2 py-1 bg-black bg-opacity-30 rounded-full">
              Unhappy
            </div>
            <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-white text-xs font-medium px-2 py-1 bg-black bg-opacity-30 rounded-full">
              Unmotivated
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 -rotate-90 text-white text-xs font-medium px-2 py-1 bg-black bg-opacity-30 rounded-full">
              Motivated
            </div>
          </div>

          {/* Three questions preview */}
          <div className="space-y-3">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <p className="text-sm font-medium text-blue-900">🎯 What are you focusing on?</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <p className="text-sm font-medium text-purple-900">💭 What are you telling yourself?</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <p className="text-sm font-medium text-green-900">🧘 What sensations are you feeling in your body?</p>
            </div>
          </div>

          {/* Value proposition */}
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-4 border border-yellow-200">
            <p className="text-sm text-center text-gray-800">
              <span className="font-semibold">After just 3 entries,</span> you&apos;ll start seeing what patterns help you feel better.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const currentSlideData = slides[currentSlide];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-2xl w-full">
        {/* Skip button */}
        <div className="flex justify-end mb-8">
          <button
            onClick={handleSkip}
            className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-smooth"
          >
            Skip
          </button>
        </div>

        {/* Slide content */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          {/* Visual */}
          <div className="mb-8">
            {currentSlideData.visual}
          </div>

          {/* Text content */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">
              {currentSlideData.title}
            </h2>
            <p className="text-lg text-gray-600 max-w-lg mx-auto">
              {currentSlideData.description}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center space-x-2 mt-8 mb-6">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-smooth ${
                  index === currentSlide
                    ? 'w-8 bg-blue-600'
                    : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Navigation button */}
          <button
            onClick={handleNext}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-smooth focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {currentSlide < 2 ? 'Next' : 'Start Tracking'}
          </button>
        </div>
      </div>
    </main>
  );
}
