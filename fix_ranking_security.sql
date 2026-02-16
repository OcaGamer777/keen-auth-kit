-- Migration: Add username to daily_rankings and fix RLS policies
-- Run this in the Supabase SQL Editor

-- 1. Add username column to daily_rankings
ALTER TABLE daily_rankings ADD COLUMN IF NOT EXISTS username text;

-- 2. Update existing records with usernames from profiles
UPDATE daily_rankings dr
SET username = p.username
FROM profiles p
WHERE dr.user_id = p.user_id AND dr.username IS NULL;

-- 3. Drop existing RLS policies on profiles (if any)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Public read access" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;

-- 4. Create restrictive RLS policy on profiles - only own data
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- 5. Drop existing RLS policies on daily_rankings (if any)
DROP POLICY IF EXISTS "Users can view own rankings" ON daily_rankings;
DROP POLICY IF EXISTS "Users can insert own rankings" ON daily_rankings;
DROP POLICY IF EXISTS "Enable read access for all users" ON daily_rankings;
DROP POLICY IF EXISTS "Authenticated users can read rankings" ON daily_rankings;

-- 6. Create RLS policies on daily_rankings - all authenticated users can read
CREATE POLICY "Authenticated users can read rankings" ON daily_rankings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert own rankings" ON daily_rankings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 7. Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_rankings ENABLE ROW LEVEL SECURITY;
