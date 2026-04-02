import { create } from 'zustand';

interface UIStore {
  lyricsOpen: boolean;
  authModalOpen: boolean;
  addSongModalOpen: boolean;
  guestPromptShown: boolean;

  toggleLyrics: () => void;
  setLyricsOpen: (open: boolean) => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  openAddSongModal: () => void;
  closeAddSongModal: () => void;
  setGuestPromptShown: (shown: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  lyricsOpen: false,
  authModalOpen: false,
  addSongModalOpen: false,
  guestPromptShown: false,

  toggleLyrics: () => set(s => ({ lyricsOpen: !s.lyricsOpen })),
  setLyricsOpen: (open) => set({ lyricsOpen: open }),
  openAuthModal: () => set({ authModalOpen: true }),
  closeAuthModal: () => set({ authModalOpen: false }),
  openAddSongModal: () => set({ addSongModalOpen: true }),
  closeAddSongModal: () => set({ addSongModalOpen: false }),
  setGuestPromptShown: (guestPromptShown) => set({ guestPromptShown }),
}));
