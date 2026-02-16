-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('USER', 'PRO', 'ADMIN');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'USER',
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'ADMIN' THEN 1
      WHEN 'PRO' THEN 2
      WHEN 'USER' THEN 3
    END
  LIMIT 1
$$;

-- Policy: Users can view all roles
CREATE POLICY "Users can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

-- Policy: Only admins can insert roles
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

-- Policy: Only admins can update roles
CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'ADMIN'));

-- Policy: Only admins can delete roles
CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'ADMIN'));

-- Drop old exercise policies that depend on profiles.role
DROP POLICY IF EXISTS "Only admins can delete exercises" ON public.exercises;
DROP POLICY IF EXISTS "Only admins can insert exercises" ON public.exercises;
DROP POLICY IF EXISTS "Only admins can update exercises" ON public.exercises;

-- Create new exercise policies using has_role function
CREATE POLICY "Only admins can delete exercises"
ON public.exercises
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Only admins can insert exercises"
ON public.exercises
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Only admins can update exercises"
ON public.exercises
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'ADMIN'));

-- Update handle_new_user function to create USER role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (user_id, username, level_progress)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    '{}'::jsonb
  );
  
  -- Insert default USER role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'USER');
  
  RETURN NEW;
END;
$$;

-- Remove role column from profiles table
ALTER TABLE public.profiles DROP COLUMN role;