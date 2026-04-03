export interface Song {
  id: string;
  user_id?: string | null;
  title: string;
  artist: string | null;
  thumbnail_url: string | null;
  storage_path: string;
  duration_seconds: number | null;
  created_at: string;
  youtube_id?: string;
  // ephemeral — not stored in DB, generated on demand
  audio_url?: string;
  is_liked?: boolean;
}


export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  is_public: boolean;
  created_at: string;
  // computed client-side
  song_count?: number;
  total_duration?: number;
  cover_thumbnail?: string | null;
}

export interface PlaylistWithSongs extends Playlist {
  songs: Song[];
}

export interface ConversionMetadata {
  title: string;
  artist: string;
  thumbnail_url: string | null;
  duration_seconds: number;
  youtube_id: string;
}

export interface ConversionProgress {
  stage: 'fetching_metadata' | 'converting' | 'uploading' | 'saving' | 'complete';
  progress: number;
}

export type SortOption = 'created_at' | 'title' | 'artist';
export type SortOrder = 'asc' | 'desc';

export interface PlayerState {
  currentSong: Song | null;
  queue: Song[];
  queueIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeat: 'off' | 'all' | 'one';
}

export interface AuthUser {
  id: string;
  email: string | null;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface Artist {
  id?: string;
  name: string;
  image_url?: string | null;
  spotify_url?: string;
}

// Guest song stored in localStorage
export interface GuestSong extends Song {
  audio_url: string; // guests always have embedded URL
}
