-- Create a table for public profiles
create table public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  role text default 'user'::text,
  full_name text
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'user');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update Tickets RLS for Admin Access

-- Drop existing policies to recreate them with Admin logic
drop policy if exists "Users can view own tickets" on public.tickets;
drop policy if exists "Users can insert own tickets" on public.tickets;
drop policy if exists "Users can update own tickets" on public.tickets;

-- Policy: Admins can view all, Users view own
create policy "Admins view all, Users view own"
  on public.tickets for select
  using (
    auth.uid() = user_id
    or
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Policy: Users can insert own tickets
create policy "Users can insert own tickets"
  on public.tickets for insert
  with check ( auth.uid() = user_id );

-- Policy: Admins can update all, Users update own
create policy "Admins update all, Users update own"
  on public.tickets for update
  using (
    auth.uid() = user_id
    or
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
