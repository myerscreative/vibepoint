# Deployment Guide: Vibepoint on Vercel

This guide walks you through deploying Vibepoint to Vercel with Supabase and Anthropic AI integration.

## Prerequisites

Before deploying, ensure you have:

- ✅ GitHub account with this repository
- ✅ Vercel account ([sign up free](https://vercel.com/signup))
- ✅ Supabase project ([create free](https://supabase.com))
- ✅ Anthropic API key ([get key](https://console.anthropic.com/))
- ✅ App icons created (see `ICONS.md`)

## Step 1: Prepare Supabase

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New project"
3. Fill in:
   - **Name**: vibepoint
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to your users
4. Click "Create new project" (takes ~2 minutes)

### 1.2 Set Up Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Run this SQL to create the mood entries table:

```sql
-- Create mood_entries table
create table public.mood_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  focus text not null,
  self_talk text not null,
  body_state text not null,
  mood_x integer not null check (mood_x >= 0 and mood_x <= 100),
  mood_y integer not null check (mood_y >= 0 and mood_y <= 100),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.mood_entries enable row level security;

-- Create policies
create policy "Users can view their own mood entries"
  on public.mood_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert their own mood entries"
  on public.mood_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own mood entries"
  on public.mood_entries for update
  using (auth.uid() = user_id);

create policy "Users can delete their own mood entries"
  on public.mood_entries for delete
  using (auth.uid() = user_id);

-- Create index for performance
create index mood_entries_user_id_created_at_idx
  on public.mood_entries(user_id, created_at desc);

-- Create profiles table for AI rate limiting
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  last_ai_request timestamp with time zone,
  ai_request_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Create function to auto-create profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

3. Click "Run" to execute

### 1.3 Configure Email Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email templates (optional):
   - Go to **Authentication** → **Email Templates**
   - Customize "Confirm signup" and "Magic Link" templates with Vibepoint branding

### 1.4 Get API Credentials

1. Go to **Settings** → **API**
2. Copy these values (you'll need them for Vercel):
   - **Project URL** (e.g., `https://abcdefg.supabase.co`)
   - **Anon public key** (starts with `eyJ...`)

**⚠️ Important**: Keep the service role key private. We only use the anon key for client-side access.

## Step 2: Get Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Sign up or log in
3. Go to **API Keys**
4. Click **Create Key**
5. Name it "vibepoint-production"
6. Copy the key (starts with `sk-ant-...`)

**💰 Cost Note**:
- Free tier: $5 credit for testing
- Pattern insights: ~1-2¢ per request
- Budget for ~500 AI requests with free credit

## Step 3: Deploy to Vercel

### 3.1 Import Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Select your Vibepoint GitHub repository
4. Click **Import**

### 3.2 Configure Project

**Framework Preset**: Next.js (should auto-detect)

**Root Directory**: `.` (leave as default)

**Build Command**: `npm run build` (default)

**Output Directory**: `.next` (default)

### 3.3 Add Environment Variables

Click **Add Environment Variables** and add these:

| Name | Value | Where to Get It |
|------|-------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Supabase → Settings → API |
| `ANTHROPIC_API_KEY` | Your Anthropic API key | Anthropic Console → API Keys |

**⚠️ Important**:
- Variables starting with `NEXT_PUBLIC_` are exposed to the browser
- `ANTHROPIC_API_KEY` should **NOT** have `NEXT_PUBLIC_` prefix (server-only)

### 3.4 Deploy

1. Click **Deploy**
2. Wait 2-3 minutes for build to complete
3. You'll see "Congratulations!" when done

## Step 4: Post-Deployment Setup

### 4.1 Configure Supabase Redirect URLs

1. Go to Supabase → **Authentication** → **URL Configuration**
2. Add these URLs:
   ```
   https://your-app-name.vercel.app/*
   https://your-app-name.vercel.app/auth/callback
   ```
3. If using custom domain:
   ```
   https://yourdomain.com/*
   https://yourdomain.com/auth/callback
   ```

### 4.2 Test Core Functionality

Visit your deployed app and test:

- ✅ **Landing page loads** (`/`)
- ✅ **Sign up works** (create test account)
- ✅ **Email confirmation** (check inbox)
- ✅ **Log mood entry** (`/mood/log`)
- ✅ **View history** (`/history`)
- ✅ **View patterns** (after 3+ entries)
- ✅ **AI insights** (after 10+ entries)

### 4.3 Test PWA Functionality

1. **Mobile (iOS)**:
   - Open in Safari
   - Tap Share → "Add to Home Screen"
   - Open from home screen
   - Should see custom icon and splash screen

2. **Mobile (Android)**:
   - Open in Chrome
   - Tap menu → "Add to Home Screen" or "Install app"
   - Open from home screen
   - Should work as standalone app

3. **Desktop**:
   - Open in Chrome/Edge
   - Look for install icon in address bar
   - Click to install
   - Should open as desktop app

### 4.4 Test Notifications

1. Log 2+ moods
2. Should see notification prompt on home page
3. Click "Enable Reminders"
4. Grant permission
5. Verify notification appears (may need to wait until scheduled time)

**Note**: Notifications require HTTPS (Vercel provides this automatically).

## Step 5: Custom Domain (Optional)

### 5.1 Add Domain in Vercel

1. Go to your project → **Settings** → **Domains**
2. Click **Add**
3. Enter your domain (e.g., `vibepoint.app`)
4. Follow DNS instructions (varies by registrar)

### 5.2 Update Supabase URLs

1. Go to Supabase → **Authentication** → **URL Configuration**
2. Add custom domain URLs:
   ```
   https://vibepoint.app/*
   https://vibepoint.app/auth/callback
   ```

### 5.3 Update Environment Variables (if needed)

If you hardcoded any URLs, update them to use custom domain.

## Step 6: Monitoring & Maintenance

### 6.1 Set Up Vercel Analytics (Optional)

1. Go to project → **Analytics**
2. Enable Web Analytics
3. Track page views, performance

**Privacy Note**: Vercel Analytics is privacy-friendly and doesn't require cookie consent.

### 6.2 Monitor Anthropic Usage

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Check **Usage** tab
3. Monitor:
   - API calls per day
   - Token usage
   - Costs

**Budget Alerts**: Set up billing alerts to avoid surprises.

### 6.3 Monitor Supabase

1. Go to Supabase → **Database** → **Usage**
2. Monitor:
   - Database size (free tier: 500MB)
   - Active users
   - API requests (free tier: 50,000/month)

### 6.4 Set Up Error Tracking (Optional)

Consider integrating:
- **Sentry** for error monitoring
- **LogRocket** for session replay
- **PostHog** for product analytics

## Common Issues & Troubleshooting

### Issue: Build Fails on Vercel

**Error**: `Module not found` or type errors

**Solution**:
```bash
# Test build locally first
npm run build

# If successful locally, check Vercel build logs
# Common causes:
# - Missing environment variables
# - Type errors (TypeScript strict mode)
# - Missing dependencies in package.json
```

### Issue: "Supabase client error: Invalid API key"

**Cause**: Wrong environment variable or not set

**Solution**:
1. Go to Vercel → Project → **Settings** → **Environment Variables**
2. Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set correctly
3. Redeploy

### Issue: Auth redirect fails

**Error**: "redirect_uri not allowed"

**Solution**:
1. Go to Supabase → **Authentication** → **URL Configuration**
2. Ensure your Vercel URL is in allowed redirect URLs
3. Format: `https://your-app.vercel.app/*`

### Issue: AI insights fail with "API key not configured"

**Cause**: `ANTHROPIC_API_KEY` not set or wrong prefix

**Solution**:
1. Verify environment variable is set in Vercel
2. Ensure it's **NOT** prefixed with `NEXT_PUBLIC_`
3. Key should start with `sk-ant-`
4. Redeploy after adding/updating

### Issue: PWA not installing on mobile

**Possible Causes**:
- Missing icons (check `/public/icon-192.png` and `/public/icon-512.png`)
- Invalid manifest.json
- Not using HTTPS (Vercel handles this)

**Solution**:
1. Verify icons exist in `/public/` directory
2. Test manifest: `https://your-app.vercel.app/manifest.json`
3. Use Chrome DevTools → Application → Manifest to check for errors

### Issue: Slow cold starts

**Cause**: Vercel serverless functions cold start

**Mitigation**:
- Upgrade to Vercel Pro for faster cold starts
- Or optimize API routes to return faster
- Consider using Edge Runtime for `/api/ai/*` routes

### Issue: "Database error: No API key found"

**Cause**: Missing `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Solution**:
1. Add environment variable in Vercel
2. Ensure it has `NEXT_PUBLIC_` prefix
3. Redeploy

## Environment Variables Reference

Full list of required environment variables:

```bash
# Required - Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Required - Anthropic AI
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Optional - Analytics (if using)
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=xxxxx
```

## Performance Optimization

### Recommended Vercel Settings

1. **Enable Compression**: Vercel does this automatically
2. **Enable Caching**: Set cache headers for static assets
3. **Image Optimization**: Use Next.js `<Image>` component (already implemented)
4. **Edge Functions**: Consider moving API routes to Edge Runtime for faster response

### Database Optimization

**Create Indexes** (already in schema above):
```sql
create index mood_entries_user_id_created_at_idx
  on public.mood_entries(user_id, created_at desc);
```

**Use Query Limits**:
- Already implemented in `lib/db.ts`
- Limits recent queries to avoid large data transfers

## Security Checklist

Before going live, verify:

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Environment variables set correctly (no secrets in code)
- ✅ Anthropic API key is server-side only (no `NEXT_PUBLIC_` prefix)
- ✅ Supabase service role key NOT used in client code
- ✅ Email confirmation enabled in Supabase
- ✅ Rate limiting implemented for AI endpoints
- ✅ PII stripping works in AI requests (test in DevTools)
- ✅ Data export/deletion endpoints functional (GDPR compliance)

## Launch Checklist

Final checks before announcing:

- ✅ All features tested in production
- ✅ AI insights generating correctly
- ✅ PWA installs on iOS and Android
- ✅ Notifications working
- ✅ Custom domain configured (if applicable)
- ✅ Privacy policy and terms of service added
- ✅ Error tracking set up
- ✅ Backup plan for database
- ✅ Monitoring dashboards configured
- ✅ Support email/contact method set up

## Scaling Considerations

### When you outgrow free tiers:

**Supabase Free → Pro** ($25/month):
- 8GB database (vs 500MB)
- 100k monthly active users (vs 50k)
- Daily backups

**Vercel Hobby → Pro** ($20/month):
- Faster builds
- More team members
- Better analytics

**Anthropic API Costs**:
- Claude Sonnet: ~$3 per 1M input tokens
- Estimate: 50 insights/day = ~$10-15/month

### Database Scaling

**When to optimize**:
- More than 10k users
- More than 100k mood entries
- Slow query times

**Options**:
- Upgrade Supabase plan
- Add more indexes
- Implement caching layer (Redis)
- Archive old entries

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Anthropic Docs**: https://docs.anthropic.com/
- **Next.js Docs**: https://nextjs.org/docs

## Post-Launch: Continuous Deployment

### Automatic Deployments

Vercel automatically deploys:
- **Production**: Every push to `main` branch
- **Preview**: Every pull request

### Deployment Workflow

1. Make changes in feature branch
2. Create pull request
3. Vercel creates preview deployment
4. Test preview URL
5. Merge to `main`
6. Auto-deploys to production

### Rollback

If deployment breaks:
1. Go to Vercel → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"
4. Instant rollback (no rebuild needed)

## Next Steps

After successful deployment:

1. **User Testing**: Invite beta users
2. **Gather Feedback**: Set up feedback mechanism
3. **Iterate**: Fix bugs, improve UX
4. **Monitor Usage**: Track which features are used
5. **Plan Pro Tier**: Based on user engagement with Pro preview features
6. **Marketing**: Share with target audience
7. **Support**: Set up help documentation

---

## Quick Reference: One-Command Deploy

For future reference, after initial setup:

```bash
# Build locally to test
npm run build

# Commit changes
git add .
git commit -m "Your change description"

# Push to trigger auto-deploy
git push origin main

# Done! Vercel auto-deploys
```

## Emergency Contact

If something goes wrong:
- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/support (Pro plan only)
- **Community**: Vercel Discord, Supabase Discord

---

**Ready to deploy? Start with Step 1!** 🚀
