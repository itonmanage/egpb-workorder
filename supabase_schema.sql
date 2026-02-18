-- Create table for tickets
create table public.tickets (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  description text,
  department text not null,
  priority text not null,
  status text default 'Pending'::text,
  user_id uuid references auth.users(id)
);

-- Set up Row Level Security (RLS)
alter table public.tickets enable row level security;

-- Policy: Users can view their own tickets
create policy "Users can view own tickets"
  on public.tickets for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own tickets
create policy "Users can insert own tickets"
  on public.tickets for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update their own tickets (optional, e.g. to cancel)
create policy "Users can update own tickets"
  on public.tickets for update
  using (auth.uid() = user_id);
