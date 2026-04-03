import { useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { usePlaylistStore } from '../store/playlistStore';
import type { Playlist, Song } from '../types';

export function usePlaylists() {
  const { user } = useAuthStore();
  const {
    playlists,
    loading,
    loadPlaylists,
    createPlaylist: storeCreate,
    updatePlaylist: storeUpdate,
    deletePlaylist: storeDelete,
    addSongToPlaylist: storeAddSong,
    removeSongFromPlaylist: storeRemoveSong,
    getPlaylistWithSongs: storeGetWS,
    reorderSongs: storeReorder,
  } = usePlaylistStore();

  useEffect(() => {
    loadPlaylists(!!user);
  }, [user, loadPlaylists]);

  const createPlaylist = async (name: string, isPublic = false): Promise<Playlist> => {
    return await storeCreate(name, isPublic, !!user);
  };

  const updatePlaylist = async (id: string, updates: { name?: string; is_public?: boolean }) => {
    await storeUpdate(id, updates, !!user);
  };

  const deletePlaylist = async (id: string) => {
    await storeDelete(id, !!user);
  };

  const addSongToPlaylist = async (playlistId: string, songId: string) => {
    await storeAddSong(playlistId, songId, !!user);
  };

  const removeSongFromPlaylist = async (playlistId: string, songId: string) => {
    await storeRemoveSong(playlistId, songId, !!user);
  };

  const getPlaylistWithSongs = useCallback(async (id: string): Promise<{ playlist: Playlist; songs: Song[]; is_owner: boolean } | null> => {
    return await storeGetWS(id, !!user);
  }, [user, storeGetWS]);

  const reorderSongs = async (playlistId: string, order: { song_id: string; position: number }[]) => {
    await storeReorder(playlistId, order, !!user);
  };

  return {
    playlists,
    loading,
    reload: () => loadPlaylists(!!user),
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    getPlaylistWithSongs,
    reorderSongs,
  };
}
