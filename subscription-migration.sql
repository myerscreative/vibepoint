-- ============================================
-- VibePoint Subscription System Migration
-- ============================================
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- User Subscriptions Table
-- ============================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'premium')) DEFAULT 'free',
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'trial', 'free')) DEFAULT 'free',
  subscription_start TIMESTAMPTZ,
  subscription_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  payment_provider TEXT CHECK (payment_provider IN ('stripe', 'apple', 'google')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  apple_transaction_id TEXT,
  google_transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier ON user_subscriptions(tier);

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Drop existing policies if they exist
-- ============================================
DROP POLICY IF EXISTS "Users can view their own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON user_subscriptions;

-- ============================================
-- RLS Policies
-- ============================================
-- Users can view their own subscription
CREATE POLICY "Users can view their own subscription"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own subscription (limited - mainly for status checks)
-- Note: Actual subscription updates should be done via webhooks/service role
CREATE POLICY "Users can update their own subscription"
  ON user_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can manage all subscriptions (for webhooks)
-- This is handled by service_role key, not RLS, but documented here
-- Service role bypasses RLS when using service_role key

-- ============================================
-- Function to automatically set updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Function to check if subscription is active
-- ============================================
CREATE OR REPLACE FUNCTION is_subscription_active(subscription_row user_subscriptions)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN subscription_row.status = 'active' 
    AND (
      subscription_row.subscription_end IS NULL 
      OR subscription_row.subscription_end > NOW()
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- Initialize existing users as free tier
-- ============================================
-- This ensures all existing users have a subscription record
INSERT INTO user_subscriptions (user_id, tier, status)
SELECT id, 'free', 'free'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_subscriptions)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- Migration complete!
-- ============================================
-- Next steps:
-- 1. Verify table exists: Go to Table Editor in Supabase
-- 2. Test subscription queries
-- 3. Set up Stripe webhooks
-- ============================================

