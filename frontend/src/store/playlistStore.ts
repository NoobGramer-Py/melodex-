import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Playlist, Song } from '../types';
import {
  fetchPlaylists,
  fetchPlaylist,
  createPlaylist as apiCreatePlaylist,
  updatePlaylist as apiUpdatePlaylist,
  deletePlaylist as apiDeletePlaylist,
  addSongToPlaylist as apiAddSong,
  removeSongFromPlaylist as apiRemoveSong,
  reorderPlaylistSongs as apiReorder,
} from '../lib/api';
import {
  getGuestPlaylists,
  saveGuestPlaylists,
  getGuestPlaylistSongs,
  saveGuestPlaylistSongs,
  getGuestSongs,
} from '../lib/guestStorage';
import { generateId } from '../lib/utils';

interface PlaylistStore {
  playlists: Playlist[];
  loading: boolean;
  initialized: boolean;
  lastAuthStatus: boolean | null;

  loadPlaylists: (isAuthenticated: boolean) => Promise<void>;
  createPlaylist: (name: string, isPublic: boolean, isAuthenticated: boolean) => Promise<Playlist>;
  updatePlaylist: (id: string, updates: Partial<Playlist>, isAuthenticated: boolean) => Promise<void>;
  deletePlaylist: (id: string, isAuthenticated: boolean) => Promise<void>;
  addSongToPlaylist: (playlistId: string, songId: string, isAuthenticated: boolean) => Promise<void>;
  removeSongFromPlaylist: (playlistId: string, songId: string, isAuthenticated: boolean) => Promise<void>;
  getPlaylistWithSongs: (id: string, isAuthenticated: boolean) => Promise<{ playlist: Playlist; songs: Song[]; is_owner: boolean } | null>;
  reorderSongs: (playlistId: string, order: { song_id: string; position: number }[], isAuthenticated: boolean) => Promise<void>;
}

export const usePlaylistStore = create<PlaylistStore>()(
  persist(
    (set, get) => ({
      playlists: [],
      loading: false,
      initialized: false,
      lastAuthStatus: null,

      loadPlaylists: async (isAuthenticated) => {
        // If already loading or initialized for this auth status, return
        if (get().loading) return;
        if (get().initialized && get().lastAuthStatus === isAuthenticated) return;
        
        set({ loading: true });
        try {
          if (isAuthenticated) {
            const { playlists: data } = await fetchPlaylists();
            set({ playlists: data, initialized: true, lastAuthStatus: isAuthenticated });
          } else {
            const guestPlaylists = getGuestPlaylists();
            set({ playlists: guestPlaylists, initialized: true, lastAuthStatus: isAuthenticated });
          }
        } catch (err) {
          console.error('[PlaylistStore] Failed to load playlists:', err);
          // Don't clear playlists on failure, just mark as initialized to stop retry loop
          set({ initialized: true, lastAuthStatus: isAuthenticated });
        } finally {
          set({ loading: false });
        }
      },

      createPlaylist: async (name, isPublic, isAuthenticated) => {
        if (isAuthenticated) {
          const { playlist } = await apiCreatePlaylist(name, isPublic);
          set(state => ({ playlists: [playlist, ...state.playlists] }));
          return playlist;
        } else {
          const playlist: Playlist = {
            id: generateId(),
            user_id: 'guest',
            name,
            is_public: false,
            created_at: new Date().toISOString(),
          };
          const updated = [playlist, ...get().playlists];
          saveGuestPlaylists(updated);
          set({ playlists: updated });
          return playlist;
        }
      },

      updatePlaylist: async (id, updates, isAuthenticated) => {
        if (isAuthenticated) {
          const { playlist } = await apiUpdatePlaylist(id, updates);
          set(state => ({
            playlists: state.playlists.map(p => p.id === id ? playlist : p)
          }));
        } else {
          const updated = get().playlists.map(p => p.id === id ? { ...p, ...updates } : p);
          saveGuestPlaylists(updated);
          set({ playlists: updated });
        }
      },

      deletePlaylist: async (id, isAuthenticated) => {
        if (isAuthenticated) {
          await apiDeletePlaylist(id);
        } else {
          const updated = get().playlists.filter(p => p.id !== id);
          saveGuestPlaylists(updated);
        }
        set(state => ({
          playlists: state.playlists.filter(p => p.id !== id)
        }));
      },

      addSongToPlaylist: async (playlistId, songId, isAuthenticated) => {
        if (isAuthenticated) {
          await apiAddSong(playlistId, songId);
        } else {
          const existing = getGuestPlaylistSongs(playlistId);
          if (!existing.includes(songId)) {
            saveGuestPlaylistSongs(playlistId, [...existing, songId]);
          }
        }
      },

      removeSongFromPlaylist: async (playlistId, songId, isAuthenticated) => {
        if (isAuthenticated) {
          await apiRemoveSong(playlistId, songId);
        } else {
          const existing = getGuestPlaylistSongs(playlistId);
          saveGuestPlaylistSongs(playlistId, existing.filter(id => id !== songId));
        }
      },

      getPlaylistWithSongs: async (id, isAuthenticated) => {
        // If not initialized, load first
        if (!get().initialized) {
          await get().loadPlaylists(isAuthenticated);
        }

        if (isAuthenticated) {
          try {
            return await fetchPlaylist(id);
          } catch {
            return null;
          }
        } else {
          const playlist = get().playlists.find(p => p.id === id);
          if (!playlist) return null;
          const songIds = getGuestPlaylistSongs(id);
          const allSongs = getGuestSongs();
          const songs = songIds.map(sid => allSongs.find(s => s.id === sid)).filter(Boolean) as Song[];
          return { playlist, songs, is_owner: true };
        }
      },

      reorderSongs: async (playlistId, order, isAuthenticated) => {
        if (isAuthenticated) {
          await apiReorder(playlistId, order);
        } else {
          saveGuestPlaylistSongs(playlistId, order.map(o => o.song_id));
        }
      },
    }),
    {
      name: 'melodex_playlist_store',
      // skip loading and initialized state during persistence
      partialize: (state) => ({ 
        playlists: state.playlists, 
        lastAuthStatus: state.lastAuthStatus 
      }),
    }
  )
);
