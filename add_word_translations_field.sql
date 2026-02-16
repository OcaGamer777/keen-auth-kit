-- Add word_translations field to exercises table
-- This stores word-by-word translations as JSON object: {"german_word": "spanish_translation", ...}

ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS word_translations JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN exercises.word_translations IS 'JSON object storing word-by-word translations: {"german_word": "spanish_translation"}';
