import { create } from 'zustand';

interface ConfirmModalState {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface UIStore {
  lyricsOpen: boolean;
  authModalOpen: boolean;
  addSongModalOpen: boolean;
  guestPromptShown: boolean;
  confirmModal: ConfirmModalState;

  toggleLyrics: () => void;
  setLyricsOpen: (open: boolean) => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  openAddSongModal: () => void;
  closeAddSongModal: () => void;
  setGuestPromptShown: (shown: boolean) => void;
  showConfirm: (state: Omit<ConfirmModalState, 'open'>) => void;
  closeConfirm: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  lyricsOpen: false,
  authModalOpen: false,
  addSongModalOpen: false,
  guestPromptShown: false,
  confirmModal: {
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  },

  toggleLyrics: () => set(s => ({ lyricsOpen: !s.lyricsOpen })),
  setLyricsOpen: (open) => set({ lyricsOpen: open }),
  openAuthModal: () => set({ authModalOpen: true }),
  closeAuthModal: () => set({ authModalOpen: false }),
  openAddSongModal: () => set({ addSongModalOpen: true }),
  closeAddSongModal: () => set({ addSongModalOpen: false }),
  setGuestPromptShown: (guestPromptShown) => set({ guestPromptShown }),

  showConfirm: (confirmModal) => set({ confirmModal: { ...confirmModal, open: true } }),
  closeConfirm: () => set(state => ({ confirmModal: { ...state.confirmModal, open: false } })),
}));
