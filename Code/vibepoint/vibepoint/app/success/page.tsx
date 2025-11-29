'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SuccessPage() {
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect to home after 3 seconds
    const timer = setTimeout(() => {
      router.push('/home')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="relative min-h-screen flex items-center justify-center py-12 px-4">
      <div 
        className="fixed inset-0 -z-10"
        style={{ 
          background: 'linear-gradient(135deg, #d4f1f9 0%, #f8e8f0 35%, #fdf6e9 65%, #f5e6e0 100%)',
          backgroundAttachment: 'fixed'
        }}
      />
      
      <div className="max-w-md w-full text-center relative z-10">
        <div className="mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1a1a2e] mb-2">
            Mood logged successfully!
          </h1>
          <p className="text-[#4a4a6a]">
            Your entry has been saved. Keep tracking to discover your patterns.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/home"
            className="block w-full rounded-[24px] px-6 py-3.5 text-base font-semibold text-white shadow-[0_4px_16px_rgba(124,58,237,0.3)] transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(45deg, #7c3aed 0%, #c026d3 50%, #f97316 100%)',
            }}
          >
            Return to Home
          </Link>

          <Link
            href="/mood/new"
            className="block w-full rounded-[24px] border-2 border-black/10 bg-white px-6 py-3.5 text-base font-semibold text-[#1a1a2e] transition-all hover:bg-gray-50"
          >
            Log Another Mood
          </Link>
        </div>

        <p className="mt-6 text-sm text-[#4a4a6a]">
          Redirecting to home in a few seconds...
        </p>
      </div>
    </div>
  )
}
