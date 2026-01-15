-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES: Users of the platform
create table public.profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  avatar_url text,
  updated_at timestamp with time zone
);

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

-- PROJECTS: Workspaces (Replit-style containers)
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  name text not null,
  description text,
  is_public boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.projects enable row level security;

create policy "Users can view their own projects"
  on projects for select
  using ( auth.uid() = user_id );

create policy "Users can create projects"
  on projects for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own projects"
  on projects for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own projects"
  on projects for delete
  using ( auth.uid() = user_id );

-- FILES: The code content
create table public.files (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  path text not null,
  content text default '',
  language text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(project_id, path)
);

alter table public.files enable row level security;

create policy "Users can manage files in their projects"
  on files for all
  using ( 
    auth.uid() in (
      select user_id from projects where id = files.project_id
    )
  );

-- Function to handle new user signup automatically
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
