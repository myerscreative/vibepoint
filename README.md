# Vibepoint

**Your Personal Mood Operating System**

The mood map that teaches you how to feel exactly how you want.

---

## What is Vibepoint?

Vibepoint is built on a simple truth: **every mood is created by three controllable inputs**.

1. What you focus on
2. What you tell yourself
3. What your body is doing

### Two Stages of Emotional Mastery

**Stage 1 (Free):** Learn to **notice** these three inputs.
*Awareness is the foundation.*

**Stage 2 (Pro):** Learn to **direct** these three inputs.
*Motion creates emotion.*

---

## Features

### Free Forever
- **Visual Mood Tracking:** Express your mood on an interactive gradient (happiness × motivation)
- **Three-Question Check-In:** Track your focus, self-talk, and body sensations
- **Timeline & Scatter Plots:** Visualize your emotional journey
- **Pattern Detection:** Unlock insights after ~20 entries
- **100% Private:** Encrypted, no ads, no tracking, no social features
- **Your Data, Your Control:** Export or delete everything with one click

### Vibepoint Pro – The Acting Coach (Coming Q1 2026)
- **Active Body Direction:** The third question upgrades from sensing → directing
- **"I want to feel X":** Get instant recipes from your best past states
- **60-Second State Scripts:** Custom emotion transitions
- **Save Your Super-States:** Name and recall peak states
- **Weekly Emotion Auditions:** Practice new emotional ranges
- **Advanced Analytics:** Deeper charts and exports

**Pricing:** $5/month or $44/year

---

## Current Features

### Progressive Unlocks
- **2+ entries:** Interactive graphs and visualizations
- **10+ entries:** Basic pattern analysis and focus area insights
- **20+ entries:** Advanced coaching insights and sentiment trends

### Emotion Coaching ✨
- Real-time sentiment analysis of your responses
- Cognitive distortion detection in self-talk
- Personalized reframing suggestions
- Pattern recognition for what affects your mood

### Data Visualization 📊
- Filter by day, week, month, 3 months, year, or all time
- Mood timeline tracking
- Sentiment charts
- Daily aggregates and summary statistics
- Focus area breakdowns
- Automatic insights from your patterns

---

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Auth & Database:** Supabase (PostgreSQL + Row-Level Security)
- **Sentiment Analysis:** Sentiment.js
- **Charts:** Recharts
- **Animations:** Framer Motion
- **Date Handling:** date-fns

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd vibepoint
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

4. **Set up the database:**

See `DATABASE.md` for complete schema and setup instructions.

5. **Run the development server:**
```bash
npm run dev
```

6. **Open your browser:**

Navigate to [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
vibepoint/
├── app/                    # Next.js app directory
│   ├── home/              # Home dashboard
│   ├── login/             # Authentication
│   ├── signup/            # User registration
│   ├── onboarding/        # Onboarding flow
│   ├── mood/log/          # Mood logging flow
│   ├── history/           # Entry history
│   ├── patterns/          # Pattern insights
│   ├── graphs/            # Data visualizations
│   └── ...
├── components/            # React components
├── lib/                   # Utilities and helpers
├── types/                 # TypeScript types
├── DATABASE.md            # Database schema documentation
└── PRODUCT.md             # Product vision and roadmap
```

---

## Key Concepts

### The Gradient Selector
- Full-screen interactive gradient
- **X-axis:** Unmotivated (left) → Motivated (right)
- **Y-axis:** Happy (top) → Unhappy (bottom)
- Tap anywhere to capture your current state

### The Three Questions (Free Version)
1. **Focus:** What are you focusing on right now?
2. **Self-talk:** What are you telling yourself?
3. **Physical:** What sensations are you feeling in your body right now?

---

## Development

### Available Scripts

- `npm run dev` – Start development server
- `npm run build` – Build for production
- `npm start` – Start production server
- `npm run lint` – Run ESLint

---

## Documentation

- **`PRODUCT.md`** – Product vision, philosophy, and roadmap (single source of truth)
- **`DATABASE.md`** – Complete database schema and setup
- **This README** – Getting started and technical overview

---

## Privacy & Security

- Row-level security on all user data
- Encrypted at rest
- No analytics or third-party tracking
- No social features or data sharing
- Users can export or permanently delete all data

---

## Accessibility

- ARIA labels on interactive elements
- Keyboard navigation support
- Focus indicators
- Screen reader announcements
- Minimum 44×44px touch targets
- Color-blind friendly descriptions

---

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

For product direction and philosophy, see `PRODUCT.md`.
