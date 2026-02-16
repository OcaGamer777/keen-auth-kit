-- Create topics table
create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.topics enable row level security;

-- Allow everyone to read topics
create policy "Topics are viewable by everyone"
  on public.topics for select
  to authenticated
  using (true);

-- Only admins can insert/update/delete topics
create policy "Admins can insert topics"
  on public.topics for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role = 'ADMIN'
    )
  );

create policy "Admins can update topics"
  on public.topics for update
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role = 'ADMIN'
    )
  );

create policy "Admins can delete topics"
  on public.topics for delete
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role = 'ADMIN'
    )
  );

-- Create index for faster lookups
create index if not exists topics_title_idx on public.topics(title);

-- Insert existing topics from exercises
insert into public.topics (title, description)
select distinct topic, 'Descripción pendiente de completar'
from public.exercises
where topic is not null and topic != ''
on conflict (title) do nothing;
