import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Song, GuestSong, SortOption, SortOrder, Artist } from '../types';
import { fetchSongs, deleteSong as apiDeleteSong } from '../lib/api';
import {
  getGuestSongs,
  addGuestSong,
  deleteGuestSong,
} from '../lib/guestStorage';
import { generateId } from '../lib/utils';

interface LibraryStore {
  songs: Song[];
  loading: boolean;
  sort: SortOption;
  order: SortOrder;
  searchQuery: string;
  initialized: boolean;
  lastAuthStatus: boolean | null;
  recentlyListened: Song[];
  favoriteArtists: Artist[];
  blacklistedRecommendations: string[];

  loadSongs: (isAuthenticated: boolean) => Promise<void>;
  addSong: (song: Partial<Song> & { title: string; storage_path: string; audio_url?: string }, isAuthenticated: boolean) => void;
  deleteSong: (id: string, isAuthenticated: boolean) => Promise<void>;
  toggleLikeSong: (song: Song, isAuthenticated: boolean) => Promise<void>;
  addToRecentlyListened: (song: Song) => void;

  removeFromRecentlyListened: (id: string) => void;
  blacklistRecommendation: (id: string) => void;
  addFavoriteArtist: (artist: Artist) => void;
  removeFavoriteArtist: (name: string) => void;
  setSort: (sort: SortOption) => void;
  setOrder: (order: SortOrder) => void;
  setSearchQuery: (query: string) => void;
  getFilteredSongs: () => Song[];
}

export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set, get) => ({
      songs: [],
      loading: false,
      sort: 'created_at',
      order: 'desc',
      searchQuery: '',
      initialized: false,
      lastAuthStatus: null,
      recentlyListened: [],
      favoriteArtists: [],
      blacklistedRecommendations: [],

      loadSongs: async (isAuthenticated) => {
        if (get().loading) return;
        // Optimization: only re-fetch if not initialized OR auth status changed
        // We leave room for manual re-loads by checking if we have data
        if (get().initialized && get().lastAuthStatus === isAuthenticated && get().songs.length > 0) return;

        set({ loading: true });
        try {
          if (isAuthenticated) {
            const { songs } = await fetchSongs(get().sort, get().order);
            set({ songs, initialized: true, lastAuthStatus: isAuthenticated });
          } else {
            const guestSongs = getGuestSongs();
            set({ songs: guestSongs, initialized: true, lastAuthStatus: isAuthenticated });
          }
        } catch (err) {
          console.error('[Library] Failed to load songs:', err);
          set({ initialized: true, lastAuthStatus: isAuthenticated });
        } finally {
          set({ loading: false });
        }
      },

      addSong: (songData, isAuthenticated) => {
        const song: Song = {
          id: songData.id || generateId(),
          user_id: null,
          title: songData.title,
          artist: songData.artist || null,
          thumbnail_url: songData.thumbnail_url || null,
          storage_path: songData.storage_path,
          duration_seconds: songData.duration_seconds || null,
          created_at: new Date().toISOString(),
          audio_url: songData.audio_url,
          youtube_id: songData.youtube_id,
          is_liked: songData.is_liked || false,
        };


        if (!isAuthenticated) {
          addGuestSong(song as GuestSong);
        }

        set(state => ({ songs: [song, ...state.songs] }));
      },

      deleteSong: async (id, isAuthenticated) => {
        if (isAuthenticated) {
          await apiDeleteSong(id);
        } else {
          deleteGuestSong(id);
        }
        set(state => ({ songs: state.songs.filter(s => s.id !== id) }));
      },

      toggleLikeSong: async (targetSong, isAuthenticated) => {
        const existingSong = get().songs.find(s => s.id === targetSong.id);
        const newStatus = existingSong ? !existingSong.is_liked : true;

        if (!existingSong) {
          // Add to library first if it's a new song being liked
          const newSong: Song = {
            ...targetSong,
            is_liked: true,
            created_at: new Date().toISOString()
          };
          
          set(state => ({
            songs: [newSong, ...state.songs]
          }));

          if (isAuthenticated) {
            try {
              const { createSong } = await import('../lib/api');
              // Persist to DB for authenticated users
              await createSong({
                ...targetSong,
                is_liked: true
              });
            } catch (err) {
              console.error('[Library] Failed to create song in DB via like:', err);
            }
          }
          return;
        }

        // Standard toggle for existing song
        set(state => ({
          songs: state.songs.map(s => s.id === targetSong.id ? { ...s, is_liked: newStatus } : s),
          recentlyListened: state.recentlyListened.map(s => s.id === targetSong.id ? { ...s, is_liked: newStatus } : s)
        }));

        if (isAuthenticated) {
          try {
            const { updateSong } = await import('../lib/api');
            await updateSong(targetSong.id, { is_liked: newStatus });
          } catch (err) {
            console.error('[Library] Failed to toggle like in DB:', err);
            // Revert on failure
            set(state => ({
              songs: state.songs.map(s => s.id === targetSong.id ? { ...s, is_liked: !newStatus } : s)
            }));
          }
        }
      },



      addToRecentlyListened: (song) => {
        set(state => {
          const filtered = state.recentlyListened.filter(s => s.id !== song.id);
          return { recentlyListened: [song, ...filtered].slice(0, 20) };
        });
      },

      removeFromRecentlyListened: (id) => {
        set(state => ({
          recentlyListened: state.recentlyListened.filter(s => s.id !== id)
        }));
      },

      blacklistRecommendation: (id) => {
        set(state => ({
          blacklistedRecommendations: [...state.blacklistedRecommendations, id]
        }));
      },

      addFavoriteArtist: (artist) => {
        set(state => {
          if (state.favoriteArtists.some(a => a.name === artist.name)) return state;
          return { favoriteArtists: [artist, ...state.favoriteArtists] };
        });
      },

      removeFavoriteArtist: (name) => {
        set(state => ({
          favoriteArtists: state.favoriteArtists.filter(a => a.name !== name)
        }));
      },

      setSort: (sort) => set({ sort }),
      setOrder: (order) => set({ order }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),

      getFilteredSongs: () => {
        const { songs, searchQuery, sort, order } = get();
        let filtered = songs;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          filtered = songs.filter(
            s =>
              s.title.toLowerCase().includes(q) ||
              (s.artist?.toLowerCase().includes(q) ?? false)
          );
        }

        return [...filtered].sort((a, b) => {
          let valA: string | number = '';
          let valB: string | number = '';

          if (sort === 'created_at') {
            valA = new Date(a.created_at).getTime();
            valB = new Date(b.created_at).getTime();
          } else if (sort === 'title') {
            valA = a.title.toLowerCase();
            valB = b.title.toLowerCase();
          } else if (sort === 'artist') {
            valA = (a.artist || '').toLowerCase();
            valB = (b.artist || '').toLowerCase();
          }

          if (valA < valB) return order === 'asc' ? -1 : 1;
          if (valA > valB) return order === 'asc' ? 1 : -1;
          return 0;
        });
      },
    }),
    {
      name: 'melodex_library_store',
      partialize: (state) => ({ 
        songs: state.songs, 
        sort: state.sort, 
        order: state.order,
        lastAuthStatus: state.lastAuthStatus,
        recentlyListened: state.recentlyListened,
        favoriteArtists: state.favoriteArtists,
        blacklistedRecommendations: state.blacklistedRecommendations
      }),
    }
  )
);
