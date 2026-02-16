-- Update profiles table structure for the learning app
ALTER TABLE public.profiles DROP COLUMN IF EXISTS native_language;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS country;

-- Add role column with enum type
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('FREE', 'PRO', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role public.user_role NOT NULL DEFAULT 'FREE',
ADD COLUMN IF NOT EXISTS level_progress jsonb DEFAULT '{}'::jsonb;

-- Create exercise type enum
DO $$ BEGIN
  CREATE TYPE public.exercise_type AS ENUM ('FILL_IN_THE_BLANK', 'LISTENING', 'IDENTIFY_THE_WORD', 'WHEEL_OF_FORTUNE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create exercises table
CREATE TABLE IF NOT EXISTS public.exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level integer NOT NULL CHECK (level >= 1 AND level <= 6),
  type public.exercise_type NOT NULL,
  topic text NOT NULL,
  statement text NOT NULL,
  correct_answer text NOT NULL,
  incorrect_answer_1 text,
  incorrect_answer_2 text,
  incorrect_answer_3 text,
  incorrect_answer_1_explanation text,
  incorrect_answer_2_explanation text,
  incorrect_answer_3_explanation text,
  german_word text,
  spanish_translation text,
  emoji text,
  hint text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for exercises
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exercises
CREATE POLICY "Anyone authenticated can read exercises"
  ON public.exercises
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert exercises"
  ON public.exercises
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

CREATE POLICY "Only admins can update exercises"
  ON public.exercises
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

CREATE POLICY "Only admins can delete exercises"
  ON public.exercises
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- Create daily_rankings table for leaderboards
CREATE TABLE IF NOT EXISTS public.daily_rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  level integer NOT NULL CHECK (level >= 1 AND level <= 6),
  score integer NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, level, date)
);

-- Enable RLS for daily_rankings
ALTER TABLE public.daily_rankings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_rankings
CREATE POLICY "Anyone authenticated can read rankings"
  ON public.daily_rankings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own rankings"
  ON public.daily_rankings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rankings"
  ON public.daily_rankings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Update handle_new_user function to support new structure
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, username, role, level_progress)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    'FREE',
    '{}'::jsonb
  );
  RETURN NEW;
END;
$function$;