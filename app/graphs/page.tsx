'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { getCurrentUser } from '@/lib/supabase';
import { getMoodEntries } from '@/lib/db';
import { MoodEntry } from '@/types';
import {
  TimePeriod,
  filterEntriesByPeriod,
  prepareMoodTimelineData,
  prepareSentimentTrendData,
  prepareFocusAreaData,
  prepareDailyAggregates,
  calculateSummaryStats,
} from '@/lib/graph-utils';

export default function GraphsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/');
        return;
      }

      const { data, error: fetchError } = await getMoodEntries();
      if (fetchError) {
        setError('Failed to load mood data');
      } else if (data) {
        setEntries(data);
      }

      setLoading(false);
    };

    loadData();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-lg text-gray-700">Loading graphs...</div>
      </main>
    );
  }

  const filteredEntries = filterEntriesByPeriod(entries, timePeriod);
  const moodTimelineData = prepareMoodTimelineData(filteredEntries);
  const sentimentTrendData = prepareSentimentTrendData(filteredEntries);
  const focusAreaData = prepareFocusAreaData(filteredEntries);
  const dailyAggregates = prepareDailyAggregates(filteredEntries);
  const stats = calculateSummaryStats(filteredEntries);

  const hasData = filteredEntries.length > 0;
  const hasSentimentData = sentimentTrendData.length > 0;

  const timePeriodOptions: { value: TimePeriod; label: string }[] = [
    { value: 'day', label: 'Last 24 Hours' },
    { value: 'week', label: 'Last Week' },
    { value: 'month', label: 'Last Month' },
    { value: '3months', label: 'Last 3 Months' },
    { value: 'year', label: 'Last Year' },
    { value: 'all', label: 'All Time' },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Emotion Graphs</h1>
            <p className="text-gray-600 mt-1">
              Visualize your emotional journey over time
            </p>
          </div>
          <Link
            href="/home"
            className="text-blue-600 hover:text-blue-700 font-medium transition-smooth"
          >
            ← Back
          </Link>
        </div>

        {/* Time Period Filter */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex items-center space-x-2 overflow-x-auto">
            {timePeriodOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTimePeriod(option.value)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-smooth ${
                  timePeriod === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {!hasData ? (
          /* Empty state */
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-600 mb-4">
              No mood entries for this time period
            </p>
            <Link
              href="/mood/log"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-smooth"
            >
              Log your first mood
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-md p-6">
                <p className="text-sm text-gray-600 mb-1">Avg Happiness</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.avgHappiness}%
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <p className="text-sm text-gray-600 mb-1">Avg Motivation</p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.avgMotivation}%
                </p>
              </div>
              {hasSentimentData && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <p className="text-sm text-gray-600 mb-1">Avg Sentiment</p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.avgSentiment.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500">out of 5</p>
                </div>
              )}
              <div className="bg-white rounded-xl shadow-md p-6">
                <p className="text-sm text-gray-600 mb-1">Total Entries</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalEntries}
                </p>
              </div>
            </div>

            {/* Mood Timeline Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Mood Over Time
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={moodTimelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="formattedDate"
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="happiness"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    name="Happiness"
                  />
                  <Line
                    type="monotone"
                    dataKey="motivation"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={{ fill: '#a855f7', r: 4 }}
                    name="Motivation"
                  />
                  <ReferenceLine
                    y={50}
                    stroke="#9ca3af"
                    strokeDasharray="3 3"
                    label="Middle"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Sentiment Trend Chart */}
            {hasSentimentData && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Sentiment Trends
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={sentimentTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="formattedDate"
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis
                      domain={[-5, 5]}
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="overall"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: '#10b981', r: 4 }}
                      name="Overall Sentiment"
                    />
                    <Line
                      type="monotone"
                      dataKey="selfTalk"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ fill: '#f59e0b', r: 3 }}
                      name="Self-Talk"
                    />
                    <ReferenceLine
                      y={0}
                      stroke="#9ca3af"
                      strokeDasharray="3 3"
                      label="Neutral"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Daily Aggregates */}
            {dailyAggregates.length > 1 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Daily Averages
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyAggregates}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="formattedDate"
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="avgHappiness" fill="#3b82f6" name="Happiness" />
                    <Bar
                      dataKey="avgMotivation"
                      fill="#a855f7"
                      name="Motivation"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Focus Area Breakdown */}
            {focusAreaData.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Focus Area Breakdown
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={focusAreaData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#6b7280" />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={100}
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#6366f1" name="Entry Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Insights */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                <span className="mr-2">💡</span>
                Graph Insights
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>
                  • Your happiness ranges from {stats.lowestHappiness}% to{' '}
                  {stats.highestHappiness}%
                </li>
                <li>
                  • Mood volatility: {stats.moodVolatility.toFixed(1)} (lower
                  is more stable)
                </li>
                {hasSentimentData && stats.avgSentiment > 0 && (
                  <li>
                    • Your overall sentiment is positive! Keep doing what
                    you&apos;re doing.
                  </li>
                )}
                {hasSentimentData && stats.avgSentiment < -1 && (
                  <li>
                    • Your sentiment has been negative. Consider reaching out
                    for support.
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
