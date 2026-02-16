-- Migration: Create app_config table for key-value configuration storage
-- Run this migration in your Supabase SQL editor

-- Create app_config table
CREATE TABLE IF NOT EXISTS public.app_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Allow public read access (configuration should be accessible to everyone)
CREATE POLICY "Allow public read access to app_config" ON public.app_config
  FOR SELECT USING (true);

-- Only admins can modify configuration
CREATE POLICY "Only admins can insert app_config" ON public.app_config
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Only admins can update app_config" ON public.app_config
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Only admins can delete app_config" ON public.app_config
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_app_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER app_config_updated_at
  BEFORE UPDATE ON public.app_config
  FOR EACH ROW
  EXECUTE FUNCTION update_app_config_updated_at();

-- Insert default configuration values
INSERT INTO public.app_config (key, value, description) VALUES
  ('default_topic', '"Die Betonung"', 'Tema por defecto para usuarios FREE o sin registrar'),
  ('app_name', '"German Learning App"', 'Nombre de la aplicación'),
  ('max_daily_exercises_free', '10', 'Máximo de ejercicios diarios para usuarios FREE'),
  ('enable_tts', 'true', 'Habilitar Text-to-Speech en ejercicios')
ON CONFLICT (key) DO NOTHING;

-- Grant usage to authenticated and anon users
GRANT SELECT ON public.app_config TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.app_config TO authenticated;
