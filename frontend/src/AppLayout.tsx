import { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './components/shared/Sidebar';
import { PlayerBar } from './components/player/PlayerBar';
import { LyricsPanel } from './components/lyrics/LyricsPanel';
import { AuthModal } from './components/auth/AuthModal';
import { AddSongModal } from './components/shared/AddSongModal';
import { GuestBanner } from './components/shared/GuestBanner';
import { BottomNav } from './components/shared/BottomNav';
import { ConfirmModal } from './components/shared/ConfirmModal';
import { useAuthStore } from './store/authStore';
import { useUIStore } from './store/uiStore';
import { hasSeenGuestPrompt } from './lib/guestStorage';

function AppLayout() {
  const { authModalOpen, addSongModalOpen, setGuestPromptShown } = useUIStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (hasSeenGuestPrompt()) {
      setGuestPromptShown(true);
    }
  }, [setGuestPromptShown]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Guest banner — only shown once to non-auth users */}
      {!user && <GuestBanner />}

      {/* Main area: sidebar + content + lyrics */}
      <div className="flex flex-1 overflow-hidden relative">
        <div className="hidden lg:flex flex-shrink-0">
          <Sidebar />
        </div>

        <main className="flex-1 overflow-hidden flex flex-col bg-background">
          <Outlet />
        </main>

        <div className="hidden xl:flex flex-shrink-0">
          <LyricsPanel />
        </div>
      </div>

      {/* Persistent player */}
      <PlayerBar />

      <BottomNav />

      {/* Modals */}
      {authModalOpen && <AuthModal />}
      {addSongModalOpen && <AddSongModal />}
      <ConfirmModal />
    </div>
  );
}

export default AppLayout;
