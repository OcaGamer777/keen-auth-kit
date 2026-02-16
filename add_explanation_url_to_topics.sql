-- Add explanation_url column to topics table
ALTER TABLE topics ADD COLUMN IF NOT EXISTS explanation_url TEXT;

-- Comment for documentation
COMMENT ON COLUMN topics.explanation_url IS 'URL to external page with topic explanation';
