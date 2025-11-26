# AI Testing Guide for Vibepoint

This guide helps you test the AI-powered features in Vibepoint to ensure they work correctly before launch.

## Prerequisites

### 1. Environment Setup

Ensure your `.env.local` file contains:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Anthropic API
ANTHROPIC_API_KEY=your_anthropic_api_key
```

⚠️ **Important**: The Anthropic API key must have access to Claude models.

### 2. Minimum Data Requirements

AI features require:
- **Pattern Analysis**: Minimum 10 mood entries
- **Emotion Recipes**: Minimum 10 mood entries with varied data

## AI Features to Test

### Feature 1: AI-Powered Pattern Insights

**Location**: `/patterns` page → "Generate AI Insights" button

**What it does**: Analyzes mood entry patterns and provides personalized coaching insights.

#### Test Steps:

1. **Create Test Data** (if you don't have 10+ entries):
   ```
   - Log 10-15 diverse mood entries
   - Use different focus areas (work, relationships, exercise, etc.)
   - Vary self-talk and body states
   - Include both high and low mood states
   - Spread entries across different times of day
   ```

2. **Navigate to Patterns Page**:
   ```
   - Go to /patterns
   - Verify you see local pattern insights first (these are non-AI)
   - Scroll to "AI-Powered Insights" section (purple/pink gradient card)
   ```

3. **Generate Insights**:
   ```
   - Click "✨ Generate AI Insights" button
   - Should show loading spinner: "AI is analyzing your patterns..."
   - Wait 3-10 seconds (API call to Claude)
   ```

4. **Verify Output**:

   ✅ **Expected Results**:
   - 3-5 insight cards appear
   - Each card has:
     - Type badge (discovery/pattern/suggestion/warning)
     - Emoji icon
     - Meaningful insight text (2-3 sentences)
   - Insights are personalized to your data
   - "🔄 Regenerate Insights" button appears

   ❌ **Common Errors**:
   - "Failed to generate insights" - Check ANTHROPIC_API_KEY
   - "Not enough data" - Need 10+ entries
   - Timeout - Check API key permissions and rate limits

5. **Test Regeneration**:
   ```
   - Click "🔄 Regenerate Insights"
   - Should generate new insights (Claude is non-deterministic)
   - Compare to previous insights - should be different but relevant
   ```

#### What to Look For:

- **Relevance**: Do insights relate to your actual mood patterns?
- **Personalization**: Do they reference your specific focus areas?
- **Actionability**: Are suggestions concrete and doable?
- **Diversity**: Mix of discovery, pattern, and suggestion types
- **Quality**: Coherent, helpful language (not generic)

### Feature 2: Emotion Recipes (Prototype)

**Location**: `/recipe-player` page (accessed from patterns page teaser)

**What it does**: Generates personalized 60-second exercises to shift emotional states.

**Note**: This is currently a **static prototype** to validate the concept. The recipe shown is hardcoded.

#### Test Steps:

1. **Navigate to Recipe Player**:
   ```
   - Go to /patterns page
   - Click "Try an Emotion Recipe" card (pink/orange gradient)
   - Should land on /recipe-player
   ```

2. **Review Recipe Structure**:
   ```
   ✅ Check that the recipe includes:
   - Title: "Your Confidence Recipe"
   - Target emotion: "confident"
   - Duration: "60 seconds"
   - 3 steps with specific instructions
   - Timer circle UI
   - "Why this works for you" explanation
   ```

3. **Test Player Functionality**:
   ```
   Step 1: Click "Start" button
   - Timer should count down from 15 seconds
   - Circle should animate (fill clockwise)

   Step 2: Let timer run out OR click "Next →"
   - Should auto-advance to step 2 (25 seconds)
   - Instruction changes to "Body adjustment"

   Step 3: Click "Previous ←"
   - Should go back to step 1
   - Timer resets

   Step 4: Click "Pause" during playback
   - Timer should freeze
   - Button changes to "Resume"

   Step 5: Complete all 3 steps
   - Should show completion screen: "Recipe Complete! 🎉"
   - Options to "Log Your New State" or "Run Recipe Again"
   ```

4. **Test Navigation**:
   ```
   - "Log Your New State" → Should go to /mood/log
   - "Run Recipe Again" → Should reset to step 1
   - "Back to Patterns" → Should go to /patterns
   - Close button (✕) → Should go to /patterns
   ```

#### Future Testing (Once Dynamic Recipes are Built):

When recipes become AI-generated (Pro tier):

```
POST /api/ai/generate-recipe

Body:
{
  "targetEmotion": "confident",
  "currentState": "anxious"
}

Expected Response:
{
  "recipe": {
    "title": "...",
    "steps": [...],
    "whyThisWorks": "..."
  }
}
```

## Testing Different Scenarios

### Scenario 1: Happy User (Positive Patterns)

**Test Data**:
- 10 entries, mostly in upper quadrants of mood map
- Consistent focus areas (e.g., "exercise", "family time")
- Positive self-talk trends

**Expected AI Insights**:
- Should identify what's working well
- Suggest maintaining positive habits
- Might identify slight dips or opportunities
- Encouraging tone

### Scenario 2: Struggling User (Negative Patterns)

**Test Data**:
- 10 entries, mostly in lower quadrants
- Work-related stress patterns
- Negative self-talk
- Body states show tension

**Expected AI Insights**:
- Should identify stress patterns
- Suggest specific interventions
- May recommend focus shifts
- Supportive, non-judgmental tone

### Scenario 3: Inconsistent User (Mixed Data)

**Test Data**:
- 10 entries spread across all quadrants
- No clear patterns
- Varied focus areas

**Expected AI Insights**:
- Should acknowledge variability
- May suggest tracking specific contexts
- Look for subtle correlations
- Help user gain clarity

## Privacy & Data Testing

### Test Data Minimization

**Verify**:
1. Open browser DevTools → Network tab
2. Click "Generate AI Insights"
3. Find POST request to `/api/ai/analyze-patterns`
4. Check request payload

✅ **Should send**:
- Pattern summaries (e.g., "work appears 5 times with avg happiness 40%")
- Statistical aggregates
- General trends

❌ **Should NOT send**:
- Raw notes/thoughts from entries
- Personally identifiable information
- Exact timestamps
- Specific identifiable contexts

**Verification**: Check `lib/ai-utils.ts` → `stripPII()` function is working.

### Test Data Export

1. Go to `/settings`
2. Click "Export My Data"
3. Download JSON file
4. Verify:
   ```
   ✅ Contains all your mood entries
   ✅ Includes metadata (created_at, focus, mood coordinates)
   ✅ No server-side AI data cached
   ```

### Test Data Deletion

1. Go to `/settings`
2. Click "Delete All Data"
3. Type "DELETE" to confirm
4. Verify:
   ```
   ✅ All entries removed from database
   ✅ Redirected to home page
   ✅ Can no longer access patterns/history
   ```

## Rate Limiting & Error Handling

### Test Rate Limits

**Current Limits** (see `AI_ARCHITECTURE.md`):
- 10 AI requests per hour per user

**Test Steps**:
1. Generate AI insights 10 times in a row (click regenerate)
2. On 11th attempt, should see error message
3. Wait 1 hour or check `last_ai_request` in database
4. Should be able to request again

### Test API Failures

**Simulate by**:
- Temporarily using invalid ANTHROPIC_API_KEY
- Or remove API key from environment

**Expected**:
- Friendly error message: "Failed to generate AI insights"
- No app crash
- Ability to try again
- Error logged to console (for debugging)

## Manual Quality Checks

### Insight Quality Rubric

For each AI-generated insight, rate:

1. **Relevance** (1-5): Does it relate to my actual patterns?
2. **Specificity** (1-5): Is it personalized vs. generic?
3. **Actionability** (1-5): Can I actually do something with this?
4. **Tone** (1-5): Is it supportive and non-judgmental?
5. **Accuracy** (1-5): Does it correctly interpret my data?

**Target**: Average score 4+ across all dimensions.

### Recipe Quality Rubric (Future)

When dynamic recipes are built:

1. **Clarity** (1-5): Are instructions clear and specific?
2. **Feasibility** (1-5): Can I do this in 60 seconds?
3. **Relevance** (1-5): Does it match target emotion?
4. **Personalization** (1-5): Does it use my data patterns?
5. **Effectiveness** (1-5): Did it help shift my state?

## Common Issues & Troubleshooting

### Issue: "ANTHROPIC_API_KEY is not configured"

**Solution**:
```bash
# Check .env.local exists
cat .env.local

# Add key if missing
echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env.local

# Restart dev server
npm run dev
```

### Issue: AI insights are generic/unhelpful

**Possible Causes**:
- Not enough diverse data (all entries too similar)
- PII stripping too aggressive (over-anonymizing)
- Prompt needs refinement

**Check**:
- Review `/app/api/ai/analyze-patterns/route.ts` prompt
- Verify pattern extraction in `lib/pattern-analysis.ts`
- Test with more varied data

### Issue: Slow response times (>15 seconds)

**Possible Causes**:
- API key rate limited
- Network issues
- Too much data being sent

**Check**:
- Anthropic API dashboard for rate limits
- Network tab in DevTools
- Size of request payload

### Issue: Insights don't reflect recent entries

**Cause**: Caching or stale data

**Solution**:
- Refresh patterns page
- Check if new entries are in database
- Clear browser cache

## Success Criteria

Before launching AI features, ensure:

- ✅ Pattern insights generate successfully 90%+ of time
- ✅ Insights are personalized and relevant (quality score 4+)
- ✅ No PII leaks in API requests
- ✅ Rate limiting works correctly
- ✅ Error messages are user-friendly
- ✅ Recipe player UI works smoothly
- ✅ Loading states are clear
- ✅ Response time < 10 seconds average

## Next Steps After Testing

1. **Gather User Feedback**: Have 3-5 users test AI features
2. **Iterate on Prompts**: Refine based on output quality
3. **Monitor API Costs**: Track tokens used per request
4. **Plan Pro Tier**: Decide on dynamic recipe implementation
5. **Document Limitations**: Be transparent about what AI can/can't do

## Resources

- **AI Architecture**: See `AI_ARCHITECTURE.md` for technical details
- **Privacy Compliance**: See data handling in `lib/ai-utils.ts`
- **Anthropic Docs**: https://docs.anthropic.com/
- **Rate Limits**: https://docs.anthropic.com/en/api/rate-limits
