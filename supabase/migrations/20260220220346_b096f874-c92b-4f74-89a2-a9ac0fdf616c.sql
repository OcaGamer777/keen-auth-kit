
-- Add avatar_icon column to profiles
ALTER TABLE public.profiles ADD COLUMN avatar_icon text DEFAULT '😀';

-- Add avatar_icon column to daily_rankings (denormalized like username)
ALTER TABLE public.daily_rankings ADD COLUMN avatar_icon text DEFAULT '😀';
