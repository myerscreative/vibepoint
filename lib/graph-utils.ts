import { MoodEntry } from '@/types';
import { format, subDays, subMonths, startOfDay, isAfter } from 'date-fns';

export type TimePeriod = 'day' | 'week' | 'month' | '3months' | 'year' | 'all';

/**
 * Filter entries based on time period
 */
export function filterEntriesByPeriod(
  entries: MoodEntry[],
  period: TimePeriod
): MoodEntry[] {
  if (period === 'all') return entries;

  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'day':
      startDate = subDays(now, 1);
      break;
    case 'week':
      startDate = subDays(now, 7);
      break;
    case 'month':
      startDate = subMonths(now, 1);
      break;
    case '3months':
      startDate = subMonths(now, 3);
      break;
    case 'year':
      startDate = subMonths(now, 12);
      break;
    default:
      return entries;
  }

  return entries.filter((entry) =>
    isAfter(new Date(entry.created_at), startDate)
  );
}

/**
 * Transform mood entries for timeline chart
 */
export interface MoodTimelineData {
  date: string;
  timestamp: number;
  happiness: number;
  motivation: number;
  overall_sentiment?: number;
  formattedDate: string;
}

export function prepareMoodTimelineData(
  entries: MoodEntry[]
): MoodTimelineData[] {
  return entries
    .map((entry) => {
      const date = new Date(entry.created_at);
      return {
        date: entry.created_at,
        timestamp: date.getTime(),
        happiness: 100 - entry.mood_y, // Invert Y axis (higher = happier)
        motivation: entry.mood_x,
        overall_sentiment: entry.overall_sentiment,
        formattedDate: format(date, 'MMM d, h:mm a'),
      };
    })
    .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Transform sentiment scores for trend chart
 */
export interface SentimentTrendData {
  date: string;
  timestamp: number;
  overall: number;
  focus: number;
  selfTalk: number;
  physical: number;
  formattedDate: string;
}

export function prepareSentimentTrendData(
  entries: MoodEntry[]
): SentimentTrendData[] {
  return entries
    .filter(
      (entry) =>
        entry.overall_sentiment !== undefined &&
        entry.overall_sentiment !== null
    )
    .map((entry) => {
      const date = new Date(entry.created_at);
      return {
        date: entry.created_at,
        timestamp: date.getTime(),
        overall: entry.overall_sentiment || 0,
        focus: entry.focus_sentiment || 0,
        selfTalk: entry.self_talk_sentiment || 0,
        physical: entry.physical_sentiment || 0,
        formattedDate: format(date, 'MMM d, h:mm a'),
      };
    })
    .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Prepare focus area frequency data for pie/bar chart
 */
export interface FocusAreaData {
  name: string;
  count: number;
  avgHappiness: number;
  avgMotivation: number;
  avgSentiment: number;
}

export function prepareFocusAreaData(entries: MoodEntry[]): FocusAreaData[] {
  const focusMap: Record<
    string,
    {
      count: number;
      totalHappiness: number;
      totalMotivation: number;
      totalSentiment: number;
      sentimentCount: number;
    }
  > = {};

  entries.forEach((entry) => {
    const focus = entry.focus.toLowerCase().trim();
    if (!focus) return;

    if (!focusMap[focus]) {
      focusMap[focus] = {
        count: 0,
        totalHappiness: 0,
        totalMotivation: 0,
        totalSentiment: 0,
        sentimentCount: 0,
      };
    }

    focusMap[focus].count++;
    focusMap[focus].totalHappiness += 100 - entry.mood_y;
    focusMap[focus].totalMotivation += entry.mood_x;

    if (
      entry.overall_sentiment !== undefined &&
      entry.overall_sentiment !== null
    ) {
      focusMap[focus].totalSentiment += entry.overall_sentiment;
      focusMap[focus].sentimentCount++;
    }
  });

  return Object.entries(focusMap)
    .map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize
      count: data.count,
      avgHappiness: Math.round(data.totalHappiness / data.count),
      avgMotivation: Math.round(data.totalMotivation / data.count),
      avgSentiment: data.sentimentCount
        ? parseFloat((data.totalSentiment / data.sentimentCount).toFixed(2))
        : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 focus areas
}

/**
 * Calculate daily aggregates for smoother visualizations
 */
export interface DailyAggregate {
  date: string;
  avgHappiness: number;
  avgMotivation: number;
  avgSentiment: number;
  count: number;
  formattedDate: string;
}

export function prepareDailyAggregates(
  entries: MoodEntry[]
): DailyAggregate[] {
  const dailyMap: Record<
    string,
    {
      totalHappiness: number;
      totalMotivation: number;
      totalSentiment: number;
      sentimentCount: number;
      count: number;
    }
  > = {};

  entries.forEach((entry) => {
    const dateKey = format(startOfDay(new Date(entry.created_at)), 'yyyy-MM-dd');

    if (!dailyMap[dateKey]) {
      dailyMap[dateKey] = {
        totalHappiness: 0,
        totalMotivation: 0,
        totalSentiment: 0,
        sentimentCount: 0,
        count: 0,
      };
    }

    dailyMap[dateKey].totalHappiness += 100 - entry.mood_y;
    dailyMap[dateKey].totalMotivation += entry.mood_x;
    dailyMap[dateKey].count++;

    if (
      entry.overall_sentiment !== undefined &&
      entry.overall_sentiment !== null
    ) {
      dailyMap[dateKey].totalSentiment += entry.overall_sentiment;
      dailyMap[dateKey].sentimentCount++;
    }
  });

  return Object.entries(dailyMap)
    .map(([date, data]) => ({
      date,
      avgHappiness: Math.round(data.totalHappiness / data.count),
      avgMotivation: Math.round(data.totalMotivation / data.count),
      avgSentiment: data.sentimentCount
        ? parseFloat((data.totalSentiment / data.sentimentCount).toFixed(2))
        : 0,
      count: data.count,
      formattedDate: format(new Date(date), 'MMM d'),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Get color for sentiment value
 */
export function getSentimentColor(value: number): string {
  if (value >= 2) return '#10b981'; // green-500
  if (value >= 0.5) return '#34d399'; // green-400
  if (value > -0.5) return '#94a3b8'; // slate-400
  if (value > -2) return '#fb923c'; // orange-400
  return '#ef4444'; // red-500
}

/**
 * Get summary statistics
 */
export interface SummaryStats {
  avgHappiness: number;
  avgMotivation: number;
  avgSentiment: number;
  totalEntries: number;
  highestHappiness: number;
  lowestHappiness: number;
  moodVolatility: number;
}

export function calculateSummaryStats(entries: MoodEntry[]): SummaryStats {
  if (entries.length === 0) {
    return {
      avgHappiness: 0,
      avgMotivation: 0,
      avgSentiment: 0,
      totalEntries: 0,
      highestHappiness: 0,
      lowestHappiness: 0,
      moodVolatility: 0,
    };
  }

  const happinessScores = entries.map((e) => 100 - e.mood_y);
  const motivationScores = entries.map((e) => e.mood_x);
  const sentimentScores = entries
    .filter((e) => e.overall_sentiment !== undefined)
    .map((e) => e.overall_sentiment!);

  const avgHappiness =
    happinessScores.reduce((sum, val) => sum + val, 0) / happinessScores.length;
  const avgMotivation =
    motivationScores.reduce((sum, val) => sum + val, 0) /
    motivationScores.length;
  const avgSentiment =
    sentimentScores.length > 0
      ? sentimentScores.reduce((sum, val) => sum + val, 0) /
        sentimentScores.length
      : 0;

  const highestHappiness = Math.max(...happinessScores);
  const lowestHappiness = Math.min(...happinessScores);

  // Calculate volatility as standard deviation
  const variance =
    happinessScores.reduce(
      (sum, val) => sum + Math.pow(val - avgHappiness, 2),
      0
    ) / happinessScores.length;
  const moodVolatility = Math.sqrt(variance);

  return {
    avgHappiness: Math.round(avgHappiness),
    avgMotivation: Math.round(avgMotivation),
    avgSentiment: parseFloat(avgSentiment.toFixed(2)),
    totalEntries: entries.length,
    highestHappiness: Math.round(highestHappiness),
    lowestHappiness: Math.round(lowestHappiness),
    moodVolatility: parseFloat(moodVolatility.toFixed(2)),
  };
}
