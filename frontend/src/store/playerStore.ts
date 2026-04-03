import { create } from 'zustand';
import type { Song } from '../types';
import { fetchSignedUrl, fetchStreamUrl } from '../lib/api';
import { useLibraryStore } from './libraryStore';

// Single shared Audio element — avoids multiple audio instances
const audio = new Audio();
audio.preload = 'metadata';

interface PlayerStore {
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
  isLoadingAudio: boolean;

  // Actions
  playSong: (song: Song, queue?: Song[]) => Promise<void>;
  togglePlay: () => void;
  playNext: () => void;
  playPrev: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  addToQueue: (song: Song) => void;
  clearQueue: () => void;
  _syncTime: () => void;
  _preResolveNext: () => Promise<void>;
  preResolve: (song: Song) => Promise<void>;
}

// Cache for resolved URLs to speed up repeated plays
const urlCache = new Map<string, { url: string; expires: number }>();

async function resolveAudioUrl(song: Song): Promise<string> {
  const cacheKey = song.youtube_id || song.storage_path || song.id;
  
  if (cacheKey && urlCache.has(cacheKey)) {
    const { url, expires } = urlCache.get(cacheKey)!;
    if (Date.now() < expires) {
      return url;
    }
  }

  let url = '';

  // 1. If it's a song from the library (has storage_path), use signed URL
  if (song.storage_path) {
    url = await fetchSignedUrl(song.storage_path, song.id || undefined);
  }
  // 2. If it's an online song (has youtube_id)
  else if (song.youtube_id) {
    // If audio_url is already a valid blob or direct CDN link, use it
    if (song.audio_url && (song.audio_url.startsWith('blob:') || song.audio_url.includes('googlevideo.com'))) {
       url = song.audio_url;
    } else {
      // Otherwise, it's a watch link or needs resolving, fetch direct stream URL from backend
      const watchUrl = `https://www.youtube.com/watch?v=${song.youtube_id}`;
      url = await fetchStreamUrl(watchUrl);
    }
  } else {
    // 3. Fallback to audio_url if available
    url = song.audio_url || '';
  }

  if (cacheKey && url) {
    // Cache for 30 minutes (YouTube stream URLs usually last 6 hours)
    urlCache.set(cacheKey, { url, expires: Date.now() + 30 * 60 * 1000 });
  }

  return url;
}


export const usePlayerStore = create<PlayerStore>((set, get) => {
  // Wire up audio element events
  audio.addEventListener('timeupdate', () => {
    set({ currentTime: audio.currentTime });
  });

  audio.addEventListener('loadedmetadata', () => {
    set({ duration: audio.duration });
  });

  audio.addEventListener('ended', () => {
    const { repeat, playNext } = get();
    if (repeat === 'one') {
      audio.currentTime = 0;
      audio.play();
    } else {
      playNext();
    }
  });

  audio.addEventListener('play', () => set({ isPlaying: true }));
  audio.addEventListener('pause', () => set({ isPlaying: false }));

  return {
    currentSong: null,
    queue: [],
    queueIndex: 0,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    isMuted: false,
    shuffle: false,
    repeat: 'off',
    isLoadingAudio: false,

    playSong: async (song, queue) => {
      // 1. Update UI state immediately (Crucial for "click reaction speed")
      const newQueue = queue || get().queue;
      const index = newQueue.findIndex(s => s.id === song.id);
      const queueIndex = index >= 0 ? index : 0;
      const finalQueue = index >= 0 ? newQueue : [song, ...get().queue];

      set({
        currentSong: song,
        queue: finalQueue,
        queueIndex,
        isLoadingAudio: true,
        currentTime: 0,
      });

      try {
        const audioUrl = await resolveAudioUrl(song);
        
        // Stop if user clicked something else in the meantime
        if (get().currentSong?.id !== song.id) return;

        audio.src = audioUrl;
        audio.volume = get().isMuted ? 0 : get().volume;
        
        // Optimization: Wait for play to start
        await audio.play();

        set({
          currentSong: { ...song, audio_url: audioUrl },
          isLoadingAudio: false,
          isPlaying: true, // Force playing state
        });

        // Add to recently listened (optional improvement: after 5s or x% completion)
        useLibraryStore.getState().addToRecentlyListened(song);

        // Pre-resolve the next song in typical listening order
        get()._preResolveNext();
      } catch (err) {
        if (get().currentSong?.id === song.id) {
          set({ isLoadingAudio: false });
        }
        console.error('[Player] Failed to play song:', err);
      }
    },

    _preResolveNext: async () => {
      const { queue, queueIndex, shuffle } = get();
      if (queue.length <= 1) return;

      const nextIndex = shuffle 
        ? Math.floor(Math.random() * queue.length)
        : (queueIndex + 1) % queue.length;
      
      const nextSong = queue[nextIndex];
      if (nextSong) {
        // Resolve but don't use it yet (puts it in urlCache)
        resolveAudioUrl(nextSong).catch(() => {});
      }
    },

    preResolve: async (song) => {
      // Small delay to avoid pre-resolving every song while user scrolls
      // We can rely on the UI to call this on hover
      if (song) {
        resolveAudioUrl(song).catch(() => {});
      }
    },



    togglePlay: () => {
      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
    },

    playNext: () => {
      const { queue, queueIndex, shuffle, repeat } = get();
      if (queue.length === 0) return;

      let nextIndex: number;
      if (shuffle) {
        nextIndex = Math.floor(Math.random() * queue.length);
      } else {
        nextIndex = queueIndex + 1;
        if (nextIndex >= queue.length) {
          if (repeat === 'all') {
            nextIndex = 0;
          } else {
            audio.pause();
            set({ isPlaying: false });
            return;
          }
        }
      }

      get().playSong(queue[nextIndex], queue);
      set({ queueIndex: nextIndex });
    },

    playPrev: () => {
      const { queue, queueIndex } = get();
      // If more than 3 seconds in, restart current song
      if (audio.currentTime > 3) {
        audio.currentTime = 0;
        return;
      }
      const prevIndex = Math.max(0, queueIndex - 1);
      if (queue[prevIndex]) {
        get().playSong(queue[prevIndex], queue);
        set({ queueIndex: prevIndex });
      }
    },

    seek: (time) => {
      audio.currentTime = time;
      set({ currentTime: time });
    },

    setVolume: (volume) => {
      audio.volume = volume;
      if (volume > 0) audio.muted = false;
      set({ volume, isMuted: volume === 0 });
    },

    toggleMute: () => {
      const { isMuted, volume } = get();
      if (isMuted) {
        audio.volume = volume;
        audio.muted = false;
        set({ isMuted: false });
      } else {
        audio.muted = true;
        set({ isMuted: true });
      }
    },

    toggleShuffle: () => set(s => ({ shuffle: !s.shuffle })),

    cycleRepeat: () => {
      const { repeat } = get();
      const next = repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off';
      set({ repeat: next });
    },

    addToQueue: (song) => {
      set(s => ({ queue: [...s.queue, song] }));
    },

    clearQueue: () => {
      audio.pause();
      audio.src = '';
      set({ queue: [], currentSong: null, isPlaying: false, queueIndex: 0 });
    },

    _syncTime: () => {
      set({ currentTime: audio.currentTime });
    },
  };
});
