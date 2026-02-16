-- Allow anonymous users to read exercises (for Level 1 access without login)
-- This policy needs to be executed in the Supabase SQL Editor

CREATE POLICY "Anyone can read exercises"
ON public.exercises
FOR SELECT
TO anon
USING (true);
