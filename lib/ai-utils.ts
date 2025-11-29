/**
 * AI Utilities
 *
 * Helper functions for data preparation, privacy protection,
 * and rate limiting for AI features.
 */

import { MoodEntry } from '@/types';

/**
 * Strip personally identifiable information from text
 */
export function stripPII(text: string): string {
  if (!text) return text;

  return text
    // Remove email addresses
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi, '[email]')
    // Remove phone numbers (various formats)
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[phone]')
    .replace(/\b\(\d{3}\)\s*\d{3}[-.]?\d{4}\b/g, '[phone]')
    // Remove full names (basic heuristic: capitalized first + last)
    .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[name]')
    // Remove addresses (street numbers + street name)
    .replace(/\b\d+\s+[A-Z][a-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct)\b/gi, '[address]')
    // Remove URLs
    .replace(/https?:\/\/[^\s]+/gi, '[url]')
    // Remove credit card-like number patterns
    .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[number]')
    // Remove SSN-like patterns
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[number]');
}

/**
 * Prepare mood entries for AI analysis (minimized data)
 */
export function prepareEntriesForAI(
  entries: MoodEntry[],
  options: { stripPII: boolean; limit?: number } = { stripPII: true }
): Array<{
  mood: { happiness: number; motivation: number };
  focus: string;
  selfTalk: string;
  physical: string;
}> {
  const entriesToProcess = options.limit ? entries.slice(0, options.limit) : entries;

  return entriesToProcess.map((entry) => ({
    mood: {
      happiness: Math.round(100 - entry.mood_y),
      motivation: Math.round(entry.mood_x),
    },
    focus: options.stripPII ? stripPII(entry.focus) : entry.focus,
    selfTalk: options.stripPII ? stripPII(entry.self_talk) : entry.self_talk,
    physical: options.stripPII ? stripPII(entry.physical) : entry.physical,
  }));
}

/**
 * Extract patterns from mood entries for AI analysis
 */
export function extractPatternsForAI(entries: MoodEntry[]): {
  happinessBoosters: Array<{ activity: string; avgBoost: number; count: number }>;
  happinessDrains: Array<{ activity: string; avgDrop: number; count: number }>;
  bodyPatterns: Array<{ sensation: string; correlation: number }>;
  selfTalkPatterns: Array<{ phrase: string; correlation: number }>;
  entryCount: number;
  timeSpanDays: number;
} {
  if (entries.length === 0) {
    return {
      happinessBoosters: [],
      happinessDrains: [],
      bodyPatterns: [],
      selfTalkPatterns: [],
      entryCount: 0,
      timeSpanDays: 0,
    };
  }

  // Calculate time span
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const firstDate = new Date(sortedEntries[0].created_at);
  const lastDate = new Date(sortedEntries[sortedEntries.length - 1].created_at);
  const timeSpanDays = Math.ceil(
    (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Group by focus areas
  const focusGroups: { [key: string]: number[] } = {};
  entries.forEach((entry) => {
    const focus = stripPII(entry.focus.toLowerCase().trim());
    if (!focusGroups[focus]) {
      focusGroups[focus] = [];
    }
    focusGroups[focus].push(100 - entry.mood_y); // happiness score
  });

  // Calculate average happiness and find boosters/drains
  const avgHappiness =
    entries.reduce((sum, e) => sum + (100 - e.mood_y), 0) / entries.length;

  const happinessBoosters: Array<{ activity: string; avgBoost: number; count: number }> = [];
  const happinessDrains: Array<{ activity: string; avgDrop: number; count: number }> = [];

  Object.entries(focusGroups).forEach(([focus, scores]) => {
    if (scores.length < 2) return; // Need at least 2 entries

    const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const diff = avgScore - avgHappiness;

    if (diff > 10) {
      happinessBoosters.push({
        activity: focus,
        avgBoost: Math.round(diff),
        count: scores.length,
      });
    } else if (diff < -10) {
      happinessDrains.push({
        activity: focus,
        avgDrop: Math.round(diff),
        count: scores.length,
      });
    }
  });

  // Sort by impact
  happinessBoosters.sort((a, b) => b.avgBoost - a.avgBoost);
  happinessDrains.sort((a, b) => a.avgDrop - b.avgDrop);

  // Find body-mood correlations
  const bodyWords: { [key: string]: { low: number; high: number } } = {};
  entries.forEach((entry) => {
    const happiness = 100 - entry.mood_y;
    const isLowMood = happiness < 40;
    const words = stripPII(entry.physical.toLowerCase()).split(/\s+/);

    words.forEach((word) => {
      if (word.length < 4) return; // Skip short words
      if (!bodyWords[word]) {
        bodyWords[word] = { low: 0, high: 0 };
      }
      if (isLowMood) {
        bodyWords[word].low++;
      } else {
        bodyWords[word].high++;
      }
    });
  });

  const bodyPatterns = Object.entries(bodyWords)
    .filter(([_, counts]) => counts.low + counts.high >= 3) // At least 3 occurrences
    .map(([word, counts]) => ({
      sensation: word,
      correlation: counts.low / (counts.low + counts.high),
    }))
    .filter((p) => p.correlation > 0.6) // Strong correlation with low mood
    .sort((a, b) => b.correlation - a.correlation)
    .slice(0, 5);

  // Find self-talk patterns
  const phrases: { [key: string]: { low: number; high: number } } = {};

  // Look for cognitive distortion keywords
  const distortionKeywords = [
    'should',
    'must',
    'always',
    'never',
    'everyone',
    'nobody',
    'terrible',
    'awful',
    'disaster',
    'failure',
    "can't",
    'impossible',
    'worthless',
    'stupid',
  ];

  entries.forEach((entry) => {
    const happiness = 100 - entry.mood_y;
    const isLowMood = happiness < 40;
    const selfTalk = stripPII(entry.self_talk.toLowerCase());

    distortionKeywords.forEach((keyword) => {
      if (selfTalk.includes(keyword)) {
        if (!phrases[keyword]) {
          phrases[keyword] = { low: 0, high: 0 };
        }
        if (isLowMood) {
          phrases[keyword].low++;
        } else {
          phrases[keyword].high++;
        }
      }
    });
  });

  const selfTalkPatterns = Object.entries(phrases)
    .filter(([_, counts]) => counts.low + counts.high >= 2)
    .map(([phrase, counts]) => ({
      phrase,
      correlation: counts.low / (counts.low + counts.high),
    }))
    .filter((p) => p.correlation > 0.55)
    .sort((a, b) => b.correlation - a.correlation)
    .slice(0, 5);

  return {
    happinessBoosters: happinessBoosters.slice(0, 5),
    happinessDrains: happinessDrains.slice(0, 5),
    bodyPatterns,
    selfTalkPatterns,
    entryCount: entries.length,
    timeSpanDays: Math.max(timeSpanDays, 1),
  };
}

/**
 * Find best states matching a target emotion
 */
export function findBestStates(
  entries: MoodEntry[],
  targetEmotion: string,
  limit: number = 3
): Array<{
  mood: { happiness: number; motivation: number };
  focus: string;
  selfTalk: string;
  physical: string;
}> {
  // Map common emotions to mood coordinates
  const emotionMap: { [key: string]: { minHappiness: number; minMotivation: number } } = {
    confident: { minHappiness: 60, minMotivation: 70 },
    happy: { minHappiness: 70, minMotivation: 50 },
    energized: { minHappiness: 60, minMotivation: 80 },
    calm: { minHappiness: 60, minMotivation: 30 },
    motivated: { minHappiness: 50, minMotivation: 70 },
    peaceful: { minHappiness: 65, minMotivation: 25 },
    excited: { minHappiness: 75, minMotivation: 85 },
    focused: { minHappiness: 55, minMotivation: 75 },
    content: { minHappiness: 65, minMotivation: 50 },
    joyful: { minHappiness: 80, minMotivation: 60 },
  };

  const target = emotionMap[targetEmotion.toLowerCase()] || {
    minHappiness: 70,
    minMotivation: 70,
  };

  // Find entries that match the target emotion criteria
  const matchingEntries = entries
    .filter((entry) => {
      const happiness = 100 - entry.mood_y;
      const motivation = entry.mood_x;
      return happiness >= target.minHappiness && motivation >= target.minMotivation;
    })
    .sort((a, b) => {
      // Sort by how well they match the target
      const scoreA = 100 - a.mood_y + a.mood_x;
      const scoreB = 100 - b.mood_y + b.mood_x;
      return scoreB - scoreA;
    });

  return prepareEntriesForAI(matchingEntries, { stripPII: true, limit });
}

/**
 * Rate limiting check (simple in-memory store)
 * In production, use Redis or database
 */
const rateLimitStore: { [key: string]: { count: number; resetAt: number } } = {};

export function checkRateLimit(
  userId: string,
  feature: string,
  maxRequests: number,
  windowMs: number = 24 * 60 * 60 * 1000 // 24 hours
): { allowed: boolean; remaining: number; resetAt: number } {
  const key = `${userId}:${feature}`;
  const now = Date.now();

  // Initialize or reset if window expired
  if (!rateLimitStore[key] || now >= rateLimitStore[key].resetAt) {
    rateLimitStore[key] = {
      count: 0,
      resetAt: now + windowMs,
    };
  }

  const record = rateLimitStore[key];

  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  record.count++;

  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Cost tracking (simple in-memory store)
 * In production, use database
 */
const costStore: { [key: string]: { cost: number; resetAt: number } } = {};

export function trackAICost(
  userId: string,
  costUSD: number,
  maxCostPerMonth: number = 2.0
): { withinBudget: boolean; totalCost: number; remaining: number } {
  const now = Date.now();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const resetAt = new Date(monthStart);
  resetAt.setMonth(resetAt.getMonth() + 1);

  // Initialize or reset if month changed
  if (!costStore[userId] || now >= costStore[userId].resetAt) {
    costStore[userId] = {
      cost: 0,
      resetAt: resetAt.getTime(),
    };
  }

  const record = costStore[userId];
  record.cost += costUSD;

  return {
    withinBudget: record.cost < maxCostPerMonth,
    totalCost: record.cost,
    remaining: Math.max(0, maxCostPerMonth - record.cost),
  };
}
