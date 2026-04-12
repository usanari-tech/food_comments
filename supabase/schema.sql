-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Create meal_logs table
create table public.meal_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  image_path text not null,
  memo text,
  processed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.meal_logs enable row level security;

create policy "Users can view own meal logs." on meal_logs
  for select using (auth.uid() = user_id);

create policy "Users can insert own meal logs." on meal_logs
  for insert with check (auth.uid() = user_id);

-- Create daily_reports table
create table public.daily_reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  report_date date not null,
  score integer,
  ai_comment text,
  nutritional_summary jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, report_date)
);

alter table public.daily_reports enable row level security;

create policy "Users can view own daily reports." on daily_reports
  for select using (auth.uid() = user_id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
