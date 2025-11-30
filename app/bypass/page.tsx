'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BypassPage() {
  const router = useRouter()

  useEffect(() => {
    // Set onboarding as completed
    localStorage.setItem('onboardingCompleted', 'true')
    // Redirect to home
    router.push('/home')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#a8edea] via-[#fed6e3] to-[#ffd8cc] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Redirecting...</h1>
        <p className="text-gray-700">Taking you to your app</p>
      </div>
    </div>
  )
}
