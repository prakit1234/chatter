   -- Enable UUID extension
   create extension if not exists "uuid-ossp";

   -- Create profiles table
   create table profiles (
       id uuid references auth.users primary key,
       username text unique,
       email text unique,
       avatar_url text,
       created_at timestamp with time zone default timezone('utc'::text, now())
   );

   -- Set up Row Level Security (RLS)
   alter table profiles enable row level security;

   -- Create policy to allow users to read all profiles
   create policy "Profiles are viewable by everyone"
       on profiles for select
       using (true);

   -- Create policy to allow users to update their own profile
   create policy "Users can update their own profile"
       on profiles for update
       using (auth.uid() = id);