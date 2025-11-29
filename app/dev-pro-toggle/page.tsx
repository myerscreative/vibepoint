'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DevProTogglePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const setPro = async () => {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/dev/set-pro', {
        method: 'POST',
      })
      const data = await response.json()
      if (response.ok) {
        setMessage('✅ ' + data.message)
        setTimeout(() => {
          router.refresh()
          window.location.reload()
        }, 1000)
      } else {
        setMessage('❌ ' + (data.error || 'Failed to set Pro status'))
      }
    } catch (error) {
      setMessage('❌ Error: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const setFree = async () => {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/dev/set-pro', {
        method: 'DELETE',
      })
      const data = await response.json()
      if (response.ok) {
        setMessage('✅ ' + data.message)
        setTimeout(() => {
          router.refresh()
          window.location.reload()
        }, 1000)
      } else {
        setMessage('❌ ' + (data.error || 'Failed to remove Pro status'))
      }
    } catch (error) {
      setMessage('❌ Error: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100 p-5">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Dev: Pro Status Toggle
        </h1>
        
        {message && (
          <div className={`mb-6 p-4 rounded-xl ${
            message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={setPro}
            disabled={loading}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Setting...' : 'Set Me as Pro User'}
          </button>

          <button
            onClick={setFree}
            disabled={loading}
            className="w-full py-4 px-6 rounded-2xl border-2 border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Setting...' : 'Set Me as Free User'}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            This is a dev-only page. Use this to toggle your subscription status for testing.
          </p>
          <div className="mt-4 flex gap-2">
            <a
              href="/recipes/new"
              className="flex-1 text-center py-2 px-4 rounded-xl bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 transition-colors"
            >
              Recipe Builder
            </a>
            <a
              href="/recipes"
              className="flex-1 text-center py-2 px-4 rounded-xl bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 transition-colors"
            >
              Recipes
            </a>
            <a
              href="/history"
              className="flex-1 text-center py-2 px-4 rounded-xl bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 transition-colors"
            >
              History
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

