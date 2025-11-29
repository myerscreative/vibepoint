-- ============================================
-- Fix: Add 'free' to status CHECK constraint
-- ============================================
-- Run this if you already ran the migration and got the error
-- ============================================

-- Drop the existing constraint
ALTER TABLE user_subscriptions 
DROP CONSTRAINT IF EXISTS user_subscriptions_status_check;

-- Add the constraint with 'free' included
ALTER TABLE user_subscriptions
ADD CONSTRAINT user_subscriptions_status_check 
CHECK (status IN ('active', 'cancelled', 'expired', 'trial', 'free'));

-- ============================================
-- Fix complete!
-- ============================================

