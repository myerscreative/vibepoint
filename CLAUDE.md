# CLAUDE.md - Vibepoint Codebase Guide for AI Assistants

This document provides a comprehensive guide to the Vibepoint codebase for AI assistants working on this project.

## Project Overview

**Vibepoint** is an intelligent mood tracking and emotion coaching application built with Next.js 15. It helps users understand their emotional patterns through:
- Visual mood logging (happiness × motivation gradient)
- Real-time sentiment analysis
- AI-powered pattern detection and coaching insights
- Interactive data visualizations

**Key Value Proposition**: Transform emotional self-awareness through visual tracking, sentiment analysis, and personalized coaching that adapts as users log more entries.

## Tech Stack

- **Framework**: Next.js 15 (App Router, React Server Components)
- **Language**: TypeScript (strict mode enabled)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL with Row-Level Security)
- **Authentication**: Supabase Auth
- **Sentiment Analysis**: Sentiment.js library
- **Data Visualization**: Recharts
- **Animations**: Framer Motion
- **Date Utilities**: date-fns

## Directory Structure

```
vibepoint/
├── app/                      # Next.js 15 App Router pages
│   ├── page.tsx             # Landing page (unauthenticated)
│   ├── layout.tsx           # Root layout with metadata
│   ├── globals.css          # Global styles and Tailwind
│   ├── home/                # Dashboard/home page (authenticated)
│   ├── login/               # Login page
│   ├── signup/              # Sign up page
│   ├── onboarding/          # 3-slide onboarding tutorial
│   ├── mood/
│   │   └── log/            # Mood logging flow (gradient + questions)
│   ├── history/            # View past mood entries
│   ├── patterns/           # Pattern insights (requires 10+ entries)
│   └── graphs/             # Interactive data visualizations
├── components/             # React components
│   ├── GradientSelector.tsx    # Interactive mood gradient picker
│   ├── CoachingCard.tsx        # Display coaching suggestions
│   └── SentimentFeedback.tsx   # Real-time sentiment feedback
├── lib/                    # Utility functions and business logic
│   ├── supabase.ts        # Supabase client and auth helpers
│   ├── db.ts              # Database CRUD operations
│   ├── mood-utils.ts      # Mood coordinate calculations
│   ├── sentiment-analysis.ts   # Sentiment scoring and coaching
│   ├── pattern-analysis.ts     # Pattern detection algorithms
│   └── graph-utils.ts     # Data transformation for charts
├── types/                  # TypeScript type definitions
│   ├── index.ts           # Core types (MoodEntry, Insight, etc.)
│   └── sentiment.d.ts     # Sentiment library type declarations
├── DATABASE.md            # Database schema documentation
├── README.md              # User-facing documentation
└── package.json           # Dependencies and scripts
```

## Key Concepts and Domain Models

### 1. Mood Coordinates

The core data model represents mood as 2D coordinates on a gradient:

- **X-axis (mood_x)**: 0-100, Unmotivated (left) → Motivated (right)
- **Y-axis (mood_y)**: 0-100, Happy (top) → Unhappy (bottom)
  - **Important**: Y is inverted for display (0 = happy, 100 = unhappy)
  - When calculating happiness, use: `happiness = 100 - mood_y`

**Mood Zones** (quadrants):
- Happy & Motivated (x ≥ 50, y < 50)
- Happy & Unmotivated (x < 50, y < 50)
- Unhappy & Motivated (x ≥ 50, y ≥ 50)
- Unhappy & Unmotivated (x < 50, y ≥ 50)

### 2. Mood Entry

Each mood log consists of:
1. **Gradient selection**: Visual mood coordinates (x, y)
2. **Three questions**:
   - Focus: "What are you focusing on?"
   - Self-talk: "What are you telling yourself?"
   - Physical: "What do you notice in your body?"
3. **Optional notes**: Additional context

### 3. Sentiment Analysis

All text responses are analyzed using the Sentiment.js library:
- **Score range**: -5 (very negative) to +5 (very positive)
- **Weighted calculation**: Self-talk has 50% weight, physical 30%, focus 20%
- **Stored fields**: `focus_sentiment`, `self_talk_sentiment`, `physical_sentiment`, `notes_sentiment`, `overall_sentiment`

### 4. Progressive Feature Unlocking

- **0-1 entries**: Basic mood logging
- **2+ entries**: Unlock graphs and visualizations
- **10+ entries**: Unlock pattern insights
- **20+ entries**: Unlock advanced coaching insights

### 5. Pattern Analysis

Three types of insights:
1. **Happiness boosters**: Focus areas correlated with higher happiness
2. **Self-talk patterns**: Negative phrases correlated with lower mood
3. **Body signals**: Physical sensations linked to mood states

### 6. Coaching Suggestions

Four types based on sentiment analysis:
- **Reframe**: Cognitive reframing for negative self-talk
- **Celebrate**: Reinforce positive mindset
- **Explore**: Investigate emotional dissonance
- **Practice**: Grounding exercises for neutral states

## Database Schema

### Tables

#### `mood_entries`
Core table storing all mood logs with sentiment scores.

**Key fields**:
- `id`, `user_id`, `created_at`
- `mood_x`, `mood_y` (0-100, constrained)
- `focus`, `self_talk`, `physical`, `notes` (text responses)
- `focus_sentiment`, `self_talk_sentiment`, `physical_sentiment`, `notes_sentiment`, `overall_sentiment` (nullable, -5 to 5)

**Index**: `(user_id, created_at DESC)` for efficient queries

#### `user_preferences`
User settings and onboarding status.

**Key fields**:
- `user_id` (unique)
- `onboarding_completed` (boolean)

**Row-Level Security (RLS)**: Both tables enforce `auth.uid() = user_id` for all operations.

See `DATABASE.md` for complete SQL schema and migration scripts.

## Common Development Tasks

### Adding a New Page

1. Create a directory under `app/` (e.g., `app/new-feature/`)
2. Add `page.tsx` with default export
3. Check authentication status if needed:
   ```typescript
   import { getCurrentUser } from '@/lib/supabase';
   const user = await getCurrentUser();
   if (!user) redirect('/login');
   ```
4. Use `'use client'` directive if you need client-side interactivity

### Working with Mood Data

**Fetch mood entries**:
```typescript
import { getMoodEntries } from '@/lib/db';
const { data: entries, error } = await getMoodEntries();
```

**Create new entry**:
```typescript
import { createMoodEntry } from '@/lib/db';
import { analyzeMoodSentiment } from '@/lib/sentiment-analysis';

const sentiments = analyzeMoodSentiment(focus, selfTalk, physical, notes);
const { data, error } = await createMoodEntry({
  mood_x: x,
  mood_y: y,
  focus,
  self_talk: selfTalk,
  physical,
  notes,
  ...sentiments
});
```

### Adding Sentiment Analysis Features

The sentiment analysis pipeline is in `lib/sentiment-analysis.ts`:
- `analyzeSentiment(text)`: Returns -5 to 5 score
- `analyzeMoodSentiment(...)`: Analyzes all entry fields with weighted average
- `getCoachingSuggestions(...)`: Generates coaching based on sentiment
- `detectCognitiveDistortions(text)`: Pattern-matches negative thinking
- `analyzeSentimentTrends(scores[])`: Calculates trend direction and volatility

### Adding Pattern Analysis Features

Pattern detection logic is in `lib/pattern-analysis.ts`:
- `analyzePatterns(entries)`: Main analysis function
- Returns `UserStats` with insights
- Insights are generated in `generateInsights()`

**To add a new insight type**:
1. Add logic to `generateInsights()` function
2. Follow existing pattern: check threshold, calculate correlation, create Insight object
3. Insights use types: `'positive' | 'warning' | 'neutral' | 'coaching'`

### Adding Data Visualizations

Charts are in the `app/graphs/` page using Recharts:
- Use `lib/graph-utils.ts` for data transformation
- Common patterns: line charts for trends, scatter plots for mood map, bar charts for categories
- Always aggregate by day for cleaner visualizations
- Add time period filters: day, week, month, 3 months, year, all time

## Code Style and Conventions

### TypeScript

- **Strict mode enabled**: All code must pass TypeScript strict checks
- **Import aliases**: Use `@/` for absolute imports (e.g., `@/lib/db`, `@/types`)
- **Type imports**: Import types from `@/types` or `@/types/sentiment`
- **No implicit any**: Always provide explicit types

### React Components

- **File naming**: PascalCase for components (e.g., `GradientSelector.tsx`)
- **Client components**: Add `'use client'` directive when using hooks or browser APIs
- **Server components**: Default in Next.js 15; prefer these when possible
- **Props interfaces**: Define interfaces for all component props

### Styling

- **Tailwind CSS**: Use utility classes exclusively
- **Custom CSS**: Minimal, only in `globals.css` for:
  - `.mood-gradient`: Radial gradient for mood selector
  - `.ripple`: Click animation effect
  - `.transition-smooth`: Consistent transitions
- **Responsive**: Mobile-first approach, test on all screen sizes
- **Accessibility**:
  - ARIA labels on all interactive elements
  - Screen reader announcements for state changes
  - Minimum 44×44px touch targets
  - Keyboard navigation support

### Database Operations

- **Always check auth**: Get current user before DB operations
- **Handle errors**: Return `{ data, error }` pattern consistently
- **RLS enforced**: Trust Supabase RLS, don't add redundant user_id checks in client
- **Transactions**: Use `.select().single()` for single records

### Sentiment Analysis

- **Normalize scores**: Always use -5 to 5 range (convert if library returns different scale)
- **Weight self-talk highest**: It's most predictive of emotional state
- **Store all scores**: Individual field sentiments + overall_sentiment
- **Performance**: Sentiment analysis is synchronous and fast; run inline during entry creation

## Important Files to Know

### Configuration Files

- **`next.config.js`**: Next.js configuration (minimal, mostly defaults)
- **`tsconfig.json`**: TypeScript config with `strict: true` and path aliases
- **`tailwind.config.ts`**: Tailwind customization (extends default theme)
- **`.env.example`**: Required environment variables template

### Core Library Files

- **`lib/supabase.ts`**: Auth helpers (signUp, signIn, signOut, getCurrentUser)
- **`lib/db.ts`**: All database CRUD operations
- **`lib/mood-utils.ts`**: Mood coordinate utilities and zone calculations
- **`lib/sentiment-analysis.ts`**: Complete sentiment analysis pipeline
- **`lib/pattern-analysis.ts`**: Pattern detection and insight generation

### Key Components

- **`components/GradientSelector.tsx`**: Full-screen mood picker with confirmation
  - Uses click coordinates to calculate mood_x and mood_y
  - Includes ripple effect and accessibility features
  - Confirmation step before proceeding

### Type Definitions

- **`types/index.ts`**: Core domain types
  - `MoodCoordinate`, `MoodEntry`, `MoodEntryInput`
  - `FocusPattern`, `Insight`, `CoachingSuggestion`
  - `UserStats`, UI state types

## Environment Variables

Required in `.env` (never commit this file):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these from Supabase project settings → API.

## Development Workflow

### Setup

```bash
npm install
cp .env.example .env
# Edit .env with Supabase credentials
# Run DATABASE.md SQL scripts in Supabase SQL editor
npm run dev
```

### Available Scripts

- `npm run dev`: Start development server (http://localhost:3000)
- `npm run build`: Production build (checks TypeScript and builds Next.js)
- `npm start`: Start production server
- `npm run lint`: Run ESLint

### Git Workflow

- Work on the current branch: `claude/claude-md-mig9qzz3vg5gl3k6-01GXwC8UNyEtwRD4Gd91bgF9`
- Commit directly to this branch
- Use descriptive commit messages
- Push with: `git push -u origin <branch-name>`

### Testing Changes

1. Always test authentication flows (login/signup/logout)
2. Test with different data states:
   - No entries (onboarding experience)
   - 1 entry (limited features)
   - 10+ entries (pattern insights unlock)
   - 20+ entries (advanced coaching unlock)
3. Check mobile responsiveness
4. Verify RLS: Can't access other users' data
5. Test sentiment analysis with various inputs

## Common Pitfalls and Best Practices

### Pitfall 1: Y-Axis Inversion

**Problem**: `mood_y` is inverted (0 = happy, 100 = unhappy) but displays opposite on screen.

**Solution**: Always use `happiness = 100 - mood_y` when calculating or displaying happiness.

**Wrong**:
```typescript
const happiness = entry.mood_y; // ❌ This is "unhappiness"
```

**Correct**:
```typescript
const happiness = 100 - entry.mood_y; // ✅ Correct happiness value
```

### Pitfall 2: Sentiment Score Ranges

**Problem**: Sentiment.js returns scores in a different range than we store.

**Solution**: Always normalize to -5 to 5 using the utility in `sentiment-analysis.ts`.

**Use**: `analyzeSentiment(text)` which handles normalization automatically.

### Pitfall 3: Progressive Feature Unlocking

**Problem**: Forgetting to check entry count before showing features.

**Solution**: Always check `entries.length` before rendering advanced features:

```typescript
{entries.length >= 10 && <PatternInsights data={entries} />}
{entries.length >= 20 && <AdvancedCoaching data={entries} />}
{entries.length >= 2 && <DataGraphs data={entries} />}
```

### Pitfall 4: Client vs Server Components

**Problem**: Using hooks in server components or missing `'use client'` directive.

**Solution**:
- Use `'use client'` for: useState, useEffect, onClick handlers, browser APIs
- Prefer Server Components for: data fetching, static content, authentication checks

### Pitfall 5: Authentication Checks

**Problem**: Forgetting to check if user is authenticated before accessing protected pages.

**Solution**: Always check auth at the start of protected pages:

```typescript
import { getCurrentUser } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // ... rest of page
}
```

### Best Practice 1: Error Handling

Always handle both success and error cases from database operations:

```typescript
const { data, error } = await getMoodEntries();
if (error) {
  console.error('Failed to fetch entries:', error);
  // Show error UI
  return;
}
// Use data safely
```

### Best Practice 2: Accessibility

- Add `aria-label` to icon buttons and interactive elements
- Use semantic HTML (`<button>`, `<nav>`, `<main>`)
- Include screen reader announcements for dynamic content
- Test keyboard navigation (Tab, Enter, Escape)

### Best Practice 3: Performance

- Use Next.js Image component for images (none currently, but if added)
- Aggregate data before visualizing (see `graph-utils.ts`)
- Limit insights to top 5 to avoid overwhelming users
- Use indexes for database queries (already configured)

### Best Practice 4: Sentiment Analysis Placement

Run sentiment analysis during entry creation, not on display:

**Correct**:
```typescript
// In mood logging flow, before saving
const sentiments = analyzeMoodSentiment(focus, selfTalk, physical, notes);
await createMoodEntry({ ...data, ...sentiments });
```

**Wrong**:
```typescript
// ❌ Don't analyze on every render or display
const sentiments = analyzeMoodSentiment(entry.self_talk); // Too late
```

### Best Practice 5: Type Safety

Leverage TypeScript for catching errors early:

```typescript
// Define types for function parameters
function processEntry(entry: MoodEntry) { // ✅ Explicit type
  // TypeScript will catch mistakes
}

// Use type imports
import { MoodEntry, Insight } from '@/types'; // ✅
```

## Working with This Codebase: Quick Reference

### I need to...

**...add a new page**: Create `app/new-page/page.tsx` with default export

**...fetch mood data**: Use `getMoodEntries()` from `@/lib/db`

**...analyze sentiment**: Use `analyzeMoodSentiment()` from `@/lib/sentiment-analysis`

**...add an insight**: Modify `generateInsights()` in `lib/pattern-analysis.ts`

**...create a visualization**: Use Recharts in `app/graphs/page.tsx` as reference

**...add authentication**: Check `getCurrentUser()` at page entry, redirect if null

**...modify the database**: Update `DATABASE.md` SQL, apply in Supabase SQL Editor

**...add a new mood question**: Update types in `types/index.ts`, modify `app/mood/log/page.tsx`, update database schema

**...change the gradient**: Modify CSS in `globals.css` (`.mood-gradient` class)

**...add a coaching suggestion**: Extend logic in `getCoachingSuggestions()` in `sentiment-analysis.ts`

## Additional Resources

- **Next.js 15 Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Recharts Docs**: https://recharts.org/
- **Sentiment.js**: https://github.com/thisandagain/sentiment
- **Tailwind CSS**: https://tailwindcss.com/docs

## Summary

Vibepoint is a well-structured Next.js application with clear separation of concerns:
- **UI Layer**: Next.js App Router pages and React components
- **Business Logic**: Utility functions in `lib/`
- **Data Layer**: Supabase with RLS
- **Analysis**: Sentiment analysis and pattern detection algorithms

Key principles:
1. **Security**: RLS enforced at database level
2. **Type Safety**: Strict TypeScript throughout
3. **Progressive Enhancement**: Features unlock as user logs more entries
4. **Accessibility**: ARIA labels, keyboard navigation, screen reader support
5. **User-Centric**: Visual mood logging with actionable coaching insights

When in doubt, reference existing patterns in the codebase. The structure is consistent and well-documented.
