-- Allow anonymous users to read topics
-- Run this in the Supabase SQL Editor

create policy "Topics are viewable by anonymous users"
  on public.topics for select
  to anon
  using (true);
