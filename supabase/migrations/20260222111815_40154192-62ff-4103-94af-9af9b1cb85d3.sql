
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS order_position integer DEFAULT 0;

-- Set initial order based on title
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY title) as rn
  FROM public.topics
)
UPDATE public.topics SET order_position = numbered.rn
FROM numbered WHERE public.topics.id = numbered.id;
