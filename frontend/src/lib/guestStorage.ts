import type { GuestSong, Playlist } from '../types';

const GUEST_SONGS_KEY = 'melodex_guest_songs';
const GUEST_PLAYLISTS_KEY = 'melodex_guest_playlists';
const GUEST_PLAYLIST_SONGS_KEY = 'melodex_guest_playlist_songs';
const GUEST_PROMPT_SHOWN_KEY = 'melodex_guest_prompt_shown';

export function getGuestSongs(): GuestSong[] {
  try {
    const raw = localStorage.getItem(GUEST_SONGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addGuestSong(song: GuestSong): void {
  const songs = getGuestSongs();
  const existingIndex = songs.findIndex(s => s.id === song.id);
  
  if (existingIndex !== -1) {
    songs[existingIndex] = song;
  } else {
    songs.unshift(song);
  }
  
  localStorage.setItem(GUEST_SONGS_KEY, JSON.stringify(songs));
}

export function updateGuestSong(id: string, updates: Partial<GuestSong>): void {
  const songs = getGuestSongs();
  const index = songs.findIndex(s => s.id === id);
  
  if (index !== -1) {
    songs[index] = { ...songs[index], ...updates };
    localStorage.setItem(GUEST_SONGS_KEY, JSON.stringify(songs));
  }
}


export function deleteGuestSong(id: string): void {
  const songs = getGuestSongs().filter(s => s.id !== id);
  localStorage.setItem(GUEST_SONGS_KEY, JSON.stringify(songs));
}

export function getGuestPlaylists(): Playlist[] {
  try {
    const raw = localStorage.getItem(GUEST_PLAYLISTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveGuestPlaylists(playlists: Playlist[]): void {
  localStorage.setItem(GUEST_PLAYLISTS_KEY, JSON.stringify(playlists));
}

export function getGuestPlaylistSongs(playlistId: string): string[] {
  try {
    const raw = localStorage.getItem(`${GUEST_PLAYLIST_SONGS_KEY}_${playlistId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveGuestPlaylistSongs(playlistId: string, songIds: string[]): void {
  localStorage.setItem(`${GUEST_PLAYLIST_SONGS_KEY}_${playlistId}`, JSON.stringify(songIds));
}

export function hasSeenGuestPrompt(): boolean {
  return localStorage.getItem(GUEST_PROMPT_SHOWN_KEY) === 'true';
}

export function markGuestPromptSeen(): void {
  localStorage.setItem(GUEST_PROMPT_SHOWN_KEY, 'true');
}
