import { useState, useEffect, useCallback } from 'react';
import type { Playlist, Song } from '../types';
import { useAuthStore } from '../store/authStore';
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
} from '../lib/guestStorage';
import { getGuestSongs } from '../lib/guestStorage';
import { generateId } from '../lib/utils';

export function usePlaylists() {
  const { user } = useAuthStore();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (user) {
        const { playlists: data } = await fetchPlaylists();
        setPlaylists(data);
      } else {
        setPlaylists(getGuestPlaylists());
      }
    } catch (err) {
      console.error('[usePlaylists] load error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const createPlaylist = async (name: string, isPublic = false): Promise<Playlist> => {
    if (user) {
      const { playlist } = await apiCreatePlaylist(name, isPublic);
      setPlaylists(prev => [playlist, ...prev]);
      return playlist;
    } else {
      const playlist: Playlist = {
        id: generateId(),
        user_id: 'guest',
        name,
        is_public: false,
        created_at: new Date().toISOString(),
      };
      const updated = [playlist, ...playlists];
      saveGuestPlaylists(updated);
      setPlaylists(updated);
      return playlist;
    }
  };

  const updatePlaylist = async (id: string, updates: { name?: string; is_public?: boolean }) => {
    if (user) {
      const { playlist } = await apiUpdatePlaylist(id, updates);
      setPlaylists(prev => prev.map(p => p.id === id ? playlist : p));
    } else {
      const updated = playlists.map(p => p.id === id ? { ...p, ...updates } : p);
      saveGuestPlaylists(updated);
      setPlaylists(updated);
    }
  };

  const deletePlaylist = async (id: string) => {
    if (user) {
      await apiDeletePlaylist(id);
    } else {
      const updated = playlists.filter(p => p.id !== id);
      saveGuestPlaylists(updated);
    }
    setPlaylists(prev => prev.filter(p => p.id !== id));
  };

  const addSongToPlaylist = async (playlistId: string, songId: string) => {
    if (user) {
      await apiAddSong(playlistId, songId);
    } else {
      const existing = getGuestPlaylistSongs(playlistId);
      if (!existing.includes(songId)) {
        saveGuestPlaylistSongs(playlistId, [...existing, songId]);
      }
    }
  };

  const removeSongFromPlaylist = async (playlistId: string, songId: string) => {
    if (user) {
      await apiRemoveSong(playlistId, songId);
    } else {
      const existing = getGuestPlaylistSongs(playlistId);
      saveGuestPlaylistSongs(playlistId, existing.filter(id => id !== songId));
    }
  };

  const getPlaylistWithSongs = useCallback(async (id: string): Promise<{ playlist: Playlist; songs: Song[]; is_owner: boolean } | null> => {
    if (user) {
      try {
        return await fetchPlaylist(id);
      } catch {
        return null;
      }
    } else {
      const playlist = playlists.find(p => p.id === id);
      if (!playlist) return null;
      const songIds = getGuestPlaylistSongs(id);
      const allSongs = getGuestSongs();
      const songs = songIds.map(sid => allSongs.find(s => s.id === sid)).filter(Boolean) as Song[];
      return { playlist, songs, is_owner: true };
    }
  }, [user, playlists]);

  const reorderSongs = async (playlistId: string, order: { song_id: string; position: number }[]) => {
    if (user) {
      await apiReorder(playlistId, order);
    } else {
      saveGuestPlaylistSongs(playlistId, order.map(o => o.song_id));
    }
  };

  return {
    playlists,
    loading,
    reload: load,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    getPlaylistWithSongs,
    reorderSongs,
  };
}
