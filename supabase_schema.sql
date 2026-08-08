-- Create custom tables that link to Supabase Auth (auth.users)

-- USERS TABLE (Public Profile)
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  name text not null,
  roles jsonb default '["USER"]'::jsonb,
  profile jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SIMULATIONS TABLE
create table public.simulations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  category text not null,
  status text default 'DRAFT' not null,
  is_public boolean default false not null,
  answers jsonb not null default '{}'::jsonb,
  generated_questions jsonb not null default '[]'::jsonb,
  decision_score integer,
  risk_score integer,
  confidence_score integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- REPORTS TABLE
create table public.reports (
  id uuid default gen_random_uuid() primary key,
  simulation_id uuid references public.simulations(id) on delete cascade not null unique,
  user_id uuid references public.users(id) on delete cascade not null,
  summary text not null,
  chart_data jsonb not null,
  timeline jsonb not null,
  scores jsonb not null,
  recommendations jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- NOTIFICATIONS TABLE
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null,
  title text not null,
  message text not null,
  is_read boolean default false not null,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ROW LEVEL SECURITY (RLS)

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.simulations enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;

-- Users can read and update their own profile
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

-- Simulations policies
create policy "Users can view own simulations" on public.simulations for select using (auth.uid() = user_id or is_public = true);
create policy "Users can insert own simulations" on public.simulations for insert with check (auth.uid() = user_id);
create policy "Users can update own simulations" on public.simulations for update using (auth.uid() = user_id);
create policy "Users can delete own simulations" on public.simulations for delete using (auth.uid() = user_id);

-- Reports policies
create policy "Users can view own reports" on public.reports for select using (auth.uid() = user_id);
create policy "Users can insert own reports" on public.reports for insert with check (auth.uid() = user_id);
create policy "Users can update own reports" on public.reports for update using (auth.uid() = user_id);
create policy "Users can delete own reports" on public.reports for delete using (auth.uid() = user_id);

-- Notifications policies
create policy "Users can view own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users can update own notifications" on public.notifications for update using (auth.uid() = user_id);

-- AUTOMATIC PROFILE CREATION ON SIGNUP
-- Trigger to automatically create a profile in public.users when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', 'New User'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
