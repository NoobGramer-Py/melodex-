import { create } from 'zustand';
import type { Song } from '../types';
import { fetchSignedUrl } from '../lib/api';

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
}

async function resolveAudioUrl(song: Song): Promise<string> {
  // If song already has a valid audio_url, use it
  if (song.audio_url && song.audio_url.startsWith('http')) {
    return song.audio_url;
  }
  // Otherwise fetch a fresh signed URL
  return fetchSignedUrl(song.storage_path, song.id || undefined);
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
      set({ isLoadingAudio: true });

      const newQueue = queue || get().queue;
      const index = newQueue.findIndex(s => s.id === song.id);
      const queueIndex = index >= 0 ? index : 0;
      const finalQueue = index >= 0 ? newQueue : [song, ...get().queue];

      try {
        const audioUrl = await resolveAudioUrl(song);
        const resolvedSong = { ...song, audio_url: audioUrl };

        audio.src = audioUrl;
        audio.volume = get().isMuted ? 0 : get().volume;
        await audio.play();

        set({
          currentSong: resolvedSong,
          queue: finalQueue,
          queueIndex,
          isLoadingAudio: false,
          currentTime: 0,
        });
      } catch (err) {
        console.error('[Player] Failed to play song:', err);
        set({ isLoadingAudio: false });
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
