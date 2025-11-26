'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, signOut } from '@/lib/supabase';
import { getMoodEntries } from '@/lib/db';
import { format, startOfWeek } from 'date-fns';
import { calculateStreak, getStreakMessage } from '@/lib/streak';
import { checkNotificationPermission, requestNotificationPermission, scheduleDailyReminder } from '@/lib/notifications';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [entriesThisWeek, setEntriesThisWeek] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);
  const [canViewPatterns, setCanViewPatterns] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [streakActive, setStreakActive] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  useEffect(() => {
    // Check auth and load stats
    const loadData = async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/');
        return;
      }

      // Get mood entries
      const { data } = await getMoodEntries();
      if (data) {
        setTotalEntries(data.length);
        setCanViewPatterns(data.length >= 3);

        // Count entries this week
        const weekStart = startOfWeek(new Date());
        const thisWeek = data.filter(
          (entry) => new Date(entry.created_at) >= weekStart
        ).length;
        setEntriesThisWeek(thisWeek);

        // Calculate streak
        const streakInfo = calculateStreak(data);
        setCurrentStreak(streakInfo.currentStreak);
        setStreakActive(streakInfo.streakActive);

        // Check if we should show notification prompt
        // Show if user has 2+ entries and hasn't granted permission
        if (data.length >= 2 && checkNotificationPermission() === 'default') {
          setShowNotificationPrompt(true);
        }
      }

      setLoading(false);
    };

    loadData();
  }, [router]);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      scheduleDailyReminder(20, 0); // 8 PM daily
      setShowNotificationPrompt(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-lg text-gray-700">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Vibepoint</h1>
          <Link
            href="/settings"
            className="text-sm text-gray-600 hover:text-gray-900 transition-smooth flex items-center space-x-1"
          >
            <span>⚙️</span>
            <span>Settings</span>
          </Link>
        </div>

        {/* Streak Card (if user has entries) */}
        {totalEntries > 0 && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl p-6 mb-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-5xl">🔥</div>
                <div>
                  <div className="text-3xl font-bold text-orange-900">{currentStreak}</div>
                  <div className="text-sm text-orange-700">
                    {currentStreak === 1 ? 'day streak' : 'days in a row'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-orange-800">
                  {getStreakMessage(currentStreak, streakActive)}
                </p>
                {currentStreak >= 3 && (
                  <p className="text-xs text-orange-600 mt-1">
                    Keep it up!
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notification Prompt */}
        {showNotificationPrompt && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-6">
            <div className="flex items-start space-x-3">
              <div className="text-3xl">🔔</div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">
                  Never miss a check-in
                </h3>
                <p className="text-sm text-blue-700 mb-3">
                  Get a gentle daily reminder to log your mood. Build the habit!
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={handleEnableNotifications}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-smooth"
                  >
                    Enable Reminders
                  </button>
                  <button
                    onClick={() => setShowNotificationPrompt(false)}
                    className="px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-smooth"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            How are you feeling?
          </h2>

          {/* Main actions */}
          <div className="space-y-4">
            <Link
              href="/mood/log"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-5 px-6 rounded-xl transition-smooth focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-center text-lg"
            >
              Log Mood
            </Link>

            <Link
              href="/history"
              className="block w-full bg-white hover:bg-gray-50 text-blue-600 font-semibold py-5 px-6 rounded-xl border-2 border-blue-600 transition-smooth focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-center text-lg"
            >
              View History
            </Link>

            {totalEntries >= 2 ? (
              <Link
                href="/graphs"
                className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-5 px-6 rounded-xl transition-smooth focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 text-center text-lg"
              >
                View Graphs 📊
              </Link>
            ) : (
              <div className="block w-full bg-gray-100 text-gray-400 font-semibold py-5 px-6 rounded-xl text-center text-lg cursor-not-allowed">
                <div>View Graphs 📊</div>
                <div className="text-xs mt-1">
                  Log {2 - totalEntries} more mood{2 - totalEntries !== 1 ? 's' : ''} to unlock
                </div>
              </div>
            )}

            {canViewPatterns ? (
              <Link
                href="/patterns"
                className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-5 px-6 rounded-xl transition-smooth focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 text-center text-lg"
              >
                See Patterns
              </Link>
            ) : (
              <div className="block w-full bg-gray-100 text-gray-400 font-semibold py-5 px-6 rounded-xl text-center text-lg cursor-not-allowed">
                <div>See Patterns</div>
                <div className="text-xs mt-1">
                  Log {3 - totalEntries} more mood{3 - totalEntries !== 1 ? 's' : ''} to unlock
                </div>
              </div>
            )}

            <Link
              href="/recipes"
              className="block w-full bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-700 hover:to-orange-700 text-white font-semibold py-5 px-6 rounded-xl transition-smooth focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 text-center text-lg flex items-center justify-center space-x-2"
            >
              <span>My Recipes</span>
              <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">PRO</span>
            </Link>
          </div>

          {/* Quick stats */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-blue-600">{entriesThisWeek}</p>
                <p className="text-sm text-gray-600 mt-1">This week</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-purple-600">{totalEntries}</p>
                <p className="text-sm text-gray-600 mt-1">Total entries</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tips or motivational message */}
        {totalEntries === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
            <p className="text-sm text-blue-900">
              💡 <strong>Tip:</strong> Tracking your mood daily helps you discover patterns and make positive changes.
            </p>
          </div>
        )}

        {totalEntries > 0 && totalEntries < 3 && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center">
            <p className="text-sm text-purple-900">
              ✨ You&apos;re {3 - totalEntries} mood{3 - totalEntries !== 1 ? 's' : ''} away from unlocking your first insights!
            </p>
          </div>
        )}

        {totalEntries >= 3 && totalEntries < 10 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <p className="text-sm text-green-900">
              🎉 Great start! Log {10 - totalEntries} more to unlock deeper pattern analysis.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
