# Vibepoint

An intelligent mood tracking and emotion coaching application that helps you understand your emotional patterns through visual mood logging, real-time sentiment analysis, and AI-powered coaching insights.

## Features

### Core Mood Tracking
- **Visual Mood Tracking**: Express your mood by tapping on an interactive gradient (happiness × motivation)
- **Contextual Questions**: Answer 3 quick questions about focus, self-talk, and physical sensations
- **History View**: Browse and review all your past mood entries with sentiment visualization
- **Pattern Analysis**: Unlock insights after 10+ entries to discover what affects your mood

### Emotion Coaching ✨
- **Real-Time Sentiment Analysis**: Automatically analyzes the sentiment of your responses (-5 to +5 scale)
- **Cognitive Distortion Detection**: Identifies unhelpful thought patterns in your self-talk (e.g., all-or-nothing thinking, catastrophizing, should statements)
- **Live Coaching Suggestions**: Get personalized reframing tips as you log your mood
- **Sentiment Trend Tracking**: Understand how your emotional tone changes over time
- **AI-Powered Coaching Insights**: Receive actionable guidance based on your patterns:
  - Identify happiness boosters and emotional drains
  - Recognize negative self-talk patterns
  - Discover body-mood connections
  - Track emotional trajectory (improving/declining/stable)
  - Get personalized action items for wellbeing

### Data Visualization 📊
- **Interactive Graphs**: Visualize your emotional journey with beautiful, interactive charts
- **Time Period Filters**: View data by day, week, month, 3 months, year, or all time
- **Mood Timeline**: Track happiness and motivation trends over time
- **Sentiment Charts**: Visualize overall sentiment and self-talk patterns
- **Daily Aggregates**: See average moods grouped by day for clearer trends
- **Focus Area Breakdown**: Understand which topics you think about most
- **Summary Statistics**: Quick stats including averages, ranges, and volatility
- **Graph Insights**: Automatic analysis of your data patterns

### Progressive Features
- **2+ Entries**: Unlock interactive graphs and visualizations
- **10+ Entries**: Unlock basic pattern analysis and focus area insights
- **20+ Entries**: Unlock advanced coaching insights and sentiment trend analysis
- **Adaptive Coaching**: The more you log, the smarter the coaching becomes

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication & Database**: Supabase
- **Sentiment Analysis**: Sentiment.js
- **Data Visualization**: Recharts
- **Animations**: Framer Motion
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd vibepoint
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Then edit `.env` and add your Supabase credentials:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

4. Set up the database (see Database Schema section below)

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

You need to create the following tables in your Supabase project:

### `mood_entries` table

```sql
create table mood_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  mood_x numeric not null check (mood_x >= 0 and mood_x <= 100),
  mood_y numeric not null check (mood_y >= 0 and mood_y <= 100),
  focus text not null,
  self_talk text not null,
  physical text not null,
  notes text
);

-- Enable Row Level Security
alter table mood_entries enable row level security;

-- Create policies
create policy "Users can view their own mood entries"
  on mood_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert their own mood entries"
  on mood_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own mood entries"
  on mood_entries for update
  using (auth.uid() = user_id);

create policy "Users can delete their own mood entries"
  on mood_entries for delete
  using (auth.uid() = user_id);

-- Create index for better query performance
create index mood_entries_user_id_created_at_idx
  on mood_entries (user_id, created_at desc);
```

### `user_preferences` table

```sql
create table user_preferences (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null unique,
  onboarding_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table user_preferences enable row level security;

-- Create policies
create policy "Users can view their own preferences"
  on user_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert their own preferences"
  on user_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own preferences"
  on user_preferences for update
  using (auth.uid() = user_id);
```

## User Experience Flow

1. **Landing Page** → Sign up or log in
2. **Onboarding** → 3-slide tutorial (skippable)
3. **Home** → Main dashboard with quick stats
4. **Log Mood** → Interactive gradient selector + 3 questions
5. **History** → View and manage past entries
6. **Patterns** → Unlock insights (10+ entries required)

## Project Structure

```
vibepoint/
├── app/                    # Next.js app directory
│   ├── home/              # Home page
│   ├── login/             # Login page
│   ├── signup/            # Sign up page
│   ├── onboarding/        # Onboarding flow
│   ├── mood/log/          # Mood logging flow
│   ├── history/           # History view
│   ├── patterns/          # Pattern insights
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global styles
├── components/            # React components
│   └── GradientSelector.tsx
├── lib/                   # Utilities and helpers
│   ├── supabase.ts        # Supabase client
│   ├── db.ts              # Database operations
│   ├── mood-utils.ts      # Mood calculations
│   └── pattern-analysis.ts # Pattern detection
├── types/                 # TypeScript types
│   └── index.ts
└── public/               # Static assets
```

## Key Features Explained

### Gradient Selector
- Full-screen interactive gradient
- X-axis: Unmotivated (left) to Motivated (right)
- Y-axis: Happy (top) to Unhappy (bottom)
- Tap anywhere to select your mood
- Visual confirmation before proceeding

### Question Flow
1. **Focus**: What are you focusing on?
2. **Self-talk**: What are you telling yourself?
3. **Physical**: What do you notice in your body?
4. **Notes** (optional): Additional context

### Pattern Analysis
- **Mood Map**: Scatter plot of all entries
- **Top Focus Areas**: Most common focus areas with average mood scores
- **Insights**: AI-generated insights about correlations
  - Happiness boosters (activities that improve mood)
  - Self-talk patterns (phrases correlated with mood changes)
  - Body wisdom (physical sensations and mood connections)

## Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation support
- Focus indicators
- Screen reader announcements
- Minimum 44×44px touch targets
- Color-blind friendly descriptions

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
