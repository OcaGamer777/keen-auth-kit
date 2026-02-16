-- Migration to change daily_rankings from date-based to timestamp-based
-- Run this in the Supabase SQL Editor

-- Drop the unique constraint that prevents multiple submissions per day
ALTER TABLE daily_rankings DROP CONSTRAINT IF EXISTS daily_rankings_user_id_level_date_key;

-- Drop the date column (we'll use created_at instead)
ALTER TABLE daily_rankings DROP COLUMN IF EXISTS date;

-- Ensure created_at column exists and has a default
ALTER TABLE daily_rankings 
  ALTER COLUMN created_at SET DEFAULT now();

-- Create an index for efficient 24-hour queries
CREATE INDEX IF NOT EXISTS idx_daily_rankings_created_at 
  ON daily_rankings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_daily_rankings_level_created_at 
  ON daily_rankings(level, created_at DESC);
