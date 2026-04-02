-- ============================================================
-- Melodex Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Songs table
create table if not exists songs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  artist text,
  thumbnail_url text,
  storage_path text not null,
  duration_seconds integer,
  created_at timestamp with time zone default now()
);

-- Playlists table
create table if not exists playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  is_public boolean default false,
  created_at timestamp with time zone default now()
);

-- Playlist songs junction table
create table if not exists playlist_songs (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid references playlists(id) on delete cascade,
  song_id uuid references songs(id) on delete cascade,
  position integer not null,
  unique(playlist_id, song_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table songs enable row level security;
alter table playlists enable row level security;
alter table playlist_songs enable row level security;

-- Songs policies
create policy "Users can view their own songs"
  on songs for select using (auth.uid() = user_id);

create policy "Users can insert their own songs"
  on songs for insert with check (auth.uid() = user_id);

create policy "Users can delete their own songs"
  on songs for delete using (auth.uid() = user_id);

-- Playlists policies
create policy "Users can view their own playlists"
  on playlists for select using (auth.uid() = user_id);

create policy "Anyone can view public playlists"
  on playlists for select using (is_public = true);

create policy "Users can insert playlists"
  on playlists for insert with check (auth.uid() = user_id);

create policy "Users can update their own playlists"
  on playlists for update using (auth.uid() = user_id);

create policy "Users can delete their own playlists"
  on playlists for delete using (auth.uid() = user_id);

-- Playlist songs policies
create policy "Users can view playlist songs for accessible playlists"
  on playlist_songs for select using (
    exists (
      select 1 from playlists p
      where p.id = playlist_id
      and (p.user_id = auth.uid() or p.is_public = true)
    )
  );

create policy "Users can manage their playlist songs"
  on playlist_songs for all using (
    exists (
      select 1 from playlists p
      where p.id = playlist_id and p.user_id = auth.uid()
    )
  );

-- ============================================================
-- Storage buckets
-- ============================================================

-- Create the audio bucket (run via Supabase Dashboard > Storage, or via API)
-- Bucket name: "audio"
-- Public: false
-- File size limit: 50MB
-- Allowed MIME types: audio/mpeg, audio/mp3

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('audio', 'audio', false, 52428800, array['audio/mpeg', 'audio/mp3'])
on conflict (id) do nothing;

-- Storage RLS
create policy "Users can upload to their own folder"
  on storage.objects for insert with check (
    bucket_id = 'audio' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read their own audio files"
  on storage.objects for select using (
    bucket_id = 'audio' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own audio files"
  on storage.objects for delete using (
    bucket_id = 'audio' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow reading audio for public playlist songs
create policy "Anyone can read audio for public playlist songs"
  on storage.objects for select using (
    bucket_id = 'audio' and
    exists (
      select 1 from songs s
      join playlist_songs ps on ps.song_id = s.id
      join playlists p on p.id = ps.playlist_id
      where s.storage_path = name and p.is_public = true
    )
  );
