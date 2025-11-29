'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import HeatMap from '@/components/HeatMap'
import EntryCard from '@/components/EntryCard'
import { MoodEntry } from '@/types'
import { GradientBackground } from '@/components/GradientBackground'

export default function EntriesPage() {
  const [entries, setEntries] = useState<MoodEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEntries()
  }, [])

  const loadEntries = async () => {
    // AUTH DISABLED FOR DEVELOPMENT - Load entries if user exists, otherwise show empty
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      setEntries([])
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })

    if (!error && data) {
      setEntries(data as MoodEntry[])
    }
    setLoading(false)
  }

  return (
    <div className="relative min-h-screen text-text-primary">
      <GradientBackground />
      
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/85 px-4 py-2.5 text-sm font-medium text-text-primary shadow-sm backdrop-blur-lg transition-all hover:bg-white/95 hover:-translate-x-0.5"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Home
          </Link>
        </div>
        
        <h1 className="text-3xl font-semibold mb-6">Your Mood History</h1>

      {/* Heat Map */}
      <div className="mb-10">
        <HeatMap entries={entries} />
      </div>

      {/* Entries */}
      {loading && (
        <p className="text-neutral-400 text-center">Loading entries...</p>
      )}

      {!loading && entries.length === 0 && (
        <p className="text-neutral-500 text-center">No entries yet.</p>
      )}

      <div className="space-y-4">
        {entries.map(entry => (
          <EntryCard key={entry.id} entry={entry} />
        ))}
      </div>
      </div>
    </div>
  )
}



