-- Add is_visible column to topics table
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS is_visible boolean DEFAULT false;

-- Update existing topics to be visible by default
UPDATE public.topics SET is_visible = true WHERE is_visible IS NULL;