# AI Architecture for Vibepoint

**Last updated: 26 November 2025**

## Philosophy

AI should enhance emotional awareness and creation **without compromising privacy**.

### Privacy-First Principles

1. **Data minimization**: Only send necessary context to AI, never entire database
2. **Zero retention**: Use Anthropic's zero data retention policy
3. **User control**: AI features are opt-in and can be disabled
4. **Transparency**: Clear disclosure of what data is processed
5. **Secure transit**: All API calls encrypted (HTTPS)
6. **Pro-tier only**: AI costs covered by subscription, not ads or data sales

---

## AI Provider: Anthropic Claude

**Why Anthropic?**
- Zero data retention option (data not used for training)
- Strong privacy commitments
- Excellent at nuanced emotional coaching
- Better context understanding than alternatives
- Supports streaming for real-time responses

**API**: Claude 3.5 Sonnet (balanced cost/quality)
**Fallback**: Claude 3 Haiku (cheaper for simple tasks)

---

## AI Features by Tier

### Free Tier (No AI)
- Rule-based sentiment analysis (current)
- Algorithmic pattern detection (current)
- Template-based coaching suggestions (current)

### Pro Tier ($5/mo or $44/yr) - AI-Enhanced
1. **Advanced Pattern Insights** - AI analyzes patterns, finds non-obvious correlations
2. **Emotion Recipes** - "I want to feel confident" → AI generates custom script from your best states
3. **Personalized Coaching** - Context-aware suggestions during mood logging
4. **60-Second State Scripts** - Guided transitions (breathing, posture, focus cues)
5. **Weekly Emotion Auditions** - AI-designed challenges to expand emotional range
6. **Body-State Mapping** (Q1 2026) - AI learns your personal body-emotion patterns

---

## Implementation Architecture

### Server-Side Processing
```
User Browser → Next.js API Route → Anthropic API → Response → User
                   ↓
            (Rate limiting, auth, data filtering)
```

**Why server-side?**
- Protects API keys
- Enables rate limiting per user
- Filters/minimizes data before sending to AI
- Adds cost controls

### API Routes to Create

1. `/api/ai/analyze-patterns` - Generate insights from mood patterns
2. `/api/ai/generate-recipe` - Create emotion recipe for target state
3. `/api/ai/coaching-suggestion` - Real-time coaching during logging
4. `/api/ai/state-script` - Generate 60-second transition script
5. `/api/ai/weekly-audition` - Create weekly emotional challenge

---

## Data Flow Examples

### Example 1: Emotion Recipe
**User request**: "I want to feel confident"

**Data sent to AI** (minimized):
```json
{
  "target_state": "confident",
  "user_best_states": [
    {
      "mood": {"happiness": 85, "motivation": 90},
      "focus": "preparing for presentation",
      "self_talk": "I know my material well",
      "physical": "shoulders back, breathing steady"
    },
    {
      "mood": {"happiness": 80, "motivation": 85},
      "focus": "finishing a project",
      "self_talk": "I can handle this",
      "physical": "energized, alert"
    }
  ],
  "user_current_state": {
    "mood": {"happiness": 50, "motivation": 40},
    "focus": "upcoming meeting",
    "self_talk": "what if I mess up",
    "physical": "tense shoulders, shallow breathing"
  }
}
```

**AI response**:
```json
{
  "recipe": {
    "title": "Your Confidence Recipe",
    "duration": "60 seconds",
    "steps": [
      {
        "step": 1,
        "focus": "Shift from 'what if I mess up' to 'I know my material'",
        "instruction": "Recall your presentation prep. You've done this before."
      },
      {
        "step": 2,
        "focus": "Body adjustment",
        "instruction": "Roll shoulders back. Take 3 deep breaths (4 count in, 6 count out)."
      },
      {
        "step": 3,
        "focus": "Anchor in past success",
        "instruction": "Remember finishing that project. Feel that same 'I can handle this' certainty."
      }
    ],
    "why_this_works": "Your data shows confidence correlates with steady breathing, upright posture, and focusing on preparation rather than outcomes."
  }
}
```

**What's NOT sent**:
- User ID, email, name
- Full entry history
- Timestamps (privacy protection)
- Notes field (may contain sensitive info)

### Example 2: Pattern Insights
**Data sent to AI**:
```json
{
  "patterns": {
    "happiness_boosters": [
      {"activity": "exercise", "avg_boost": 25, "sample_size": 12},
      {"activity": "creative work", "avg_boost": 18, "sample_size": 8}
    ],
    "happiness_drains": [
      {"activity": "social media", "avg_drop": -15, "sample_size": 15}
    ],
    "body_patterns": [
      {"sensation": "tense shoulders", "correlation_with_low_mood": 0.78}
    ],
    "self_talk_patterns": [
      {"phrase": "should have", "correlation_with_low_mood": 0.65}
    ]
  },
  "entry_count": 45,
  "time_span_days": 30
}
```

**AI response**:
```json
{
  "insights": [
    {
      "type": "discovery",
      "insight": "Your body is a reliable early warning system. Tense shoulders appear in 78% of low-mood entries. Try shoulder rolls when you notice tension—it might shift your mood before it drops."
    },
    {
      "type": "pattern",
      "insight": "Exercise consistently boosts your happiness by ~25 points. The effect seems strongest when you focus on how movement feels, not performance."
    },
    {
      "type": "language",
      "insight": "'Should have' thinking correlates with 65% of your unhappy moments. When you catch this phrase, try replacing it with 'next time I could...'"
    }
  ]
}
```

---

## Cost Management

### Anthropic Pricing (Claude 3.5 Sonnet)
- Input: $3 per million tokens (~$0.003 per 1K tokens)
- Output: $15 per million tokens (~$0.015 per 1K tokens)

### Estimated Costs per User/Month
- Pattern analysis (weekly): ~2K tokens → $0.04/month
- Emotion recipes (3x/month): ~3K tokens → $0.12/month
- Coaching suggestions (daily): ~1K tokens → $0.90/month
- State scripts (5x/month): ~2K tokens → $0.10/month

**Total: ~$1.20/user/month**

**Revenue**: $5/month Pro subscription
**Margin**: $3.80/user/month (76% margin)

### Rate Limits
- Free tier: No AI access
- Pro tier:
  - 20 AI coaching suggestions/day
  - 10 emotion recipes/week
  - 1 pattern analysis/week
  - 5 state scripts/week
  - Unlimited weekly auditions (cheap, cached)

---

## Privacy Safeguards

### 1. Data Minimization
```typescript
// Example: Only send aggregated patterns, not raw entries
function prepareDataForAI(entries: MoodEntry[]) {
  return {
    patterns: extractPatterns(entries),
    // NOT: entries (would expose raw user data)
  };
}
```

### 2. PII Stripping
```typescript
function stripPII(text: string): string {
  // Remove names, emails, phone numbers, addresses
  return text
    .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[name]')
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[email]')
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[phone]');
}
```

### 3. Zero Retention Headers
```typescript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  headers: {
    'anthropic-version': '2023-06-01',
    'anthropic-beta': 'max-tokens-3-5-sonnet-2024-07-15',
    'content-type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY,
  },
  // Note: Anthropic doesn't train on API data by default
});
```

### 4. User Consent
Add to Pro upgrade flow:
```
✓ I understand that AI features analyze my mood data to provide
  personalized insights. My data is processed securely and not
  stored by our AI provider.

[Learn more about our privacy practices]
```

### 5. Audit Logging
```typescript
// Log AI requests for transparency (user can view)
await logAIRequest({
  user_id: userId,
  feature: 'emotion_recipe',
  timestamp: new Date(),
  token_count: response.usage.total_tokens,
  cost_cents: calculateCost(response.usage),
});
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Set up Anthropic API integration
- [ ] Create `/api/ai/analyze-patterns` endpoint
- [ ] Add AI usage logging
- [ ] Implement rate limiting
- [ ] Add Pro tier check to API routes

### Phase 2: Core Features (Week 2)
- [ ] Build emotion recipe generator
- [ ] Create 60-second state scripts
- [ ] Add real-time coaching suggestions
- [ ] Implement weekly audition generator

### Phase 3: UI Integration (Week 3)
- [ ] Add "Get AI Insights" button to patterns page
- [ ] Create "Emotion Recipe" interface
- [ ] Build state script player with timer
- [ ] Design weekly audition card

### Phase 4: Polish & Testing (Week 4)
- [ ] Add loading states and animations
- [ ] Implement error handling
- [ ] User testing with real data
- [ ] Privacy disclosure and consent flow
- [ ] Cost monitoring dashboard (admin)

---

## Environment Variables

Add to `.env`:
```bash
# Anthropic AI
ANTHROPIC_API_KEY=sk-ant-xxx
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
ANTHROPIC_FALLBACK_MODEL=claude-3-haiku-20240307

# AI Feature Flags
AI_FEATURES_ENABLED=true
AI_RATE_LIMIT_PER_DAY=50

# Cost Controls
AI_MAX_COST_PER_USER_PER_MONTH=2.00
```

---

## Monitoring

Track:
1. **Usage**: AI requests per user/day
2. **Costs**: Tokens consumed, $ spent
3. **Quality**: User feedback on AI responses
4. **Errors**: Failed requests, rate limits hit
5. **Performance**: Response time (target <3s)

---

## Future Enhancements

### Q1 2026 - Pro "Acting Coach" Features
- **Body-state mapping**: AI learns your unique body-emotion signatures
- **Predictive nudges**: "Your shoulders are tense—usually precedes low mood in 2 hours"
- **Voice coaching**: Audio state scripts with AI-generated voice
- **Micro-adjustments**: Real-time posture/breathing cues

### Q2 2026 - Advanced
- **Emotion forecasting**: Predict mood trends based on patterns
- **Social situation prep**: "You have dinner with family tonight—here's your confidence recipe"
- **Long-term arc analysis**: Monthly emotional growth reports

---

## Privacy Compliance

### GDPR
- ✓ Data minimization (only send necessary data)
- ✓ User consent (explicit opt-in for AI)
- ✓ Right to deletion (clear AI request logs on user delete)
- ✓ Transparency (clear disclosure of AI processing)

### CCPA
- ✓ Disclosure of third-party data sharing (Anthropic API)
- ✓ Opt-out mechanism (disable AI features)
- ✓ Data access (users can see AI request logs)

---

## Success Metrics

### Product Metrics
- AI feature usage rate among Pro users
- Recipe generation frequency
- User ratings of AI insights (5-star)
- Retention impact (Pro users with AI vs without)

### Technical Metrics
- API uptime (target: 99.9%)
- Response time (target: <3s p95)
- Cost per user (target: <$1.50/mo)
- Error rate (target: <0.1%)

---

This architecture enables powerful AI features while maintaining Vibepoint's privacy-first principles.
