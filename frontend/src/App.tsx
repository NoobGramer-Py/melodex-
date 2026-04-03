import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import AppLayout from './AppLayout';
import HomePage from './pages/HomePage';
import LibraryPage from './pages/LibraryPage';
import PlaylistsPage from './pages/PlaylistsPage';
import PlaylistDetailPage from './pages/PlaylistDetailPage';
import PublicPlaylistPage from './pages/PublicPlaylistPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import { useAuthStore } from './store/authStore';
import { usePlaylistStore } from './store/playlistStore';

function AppRoutes() {
  const { user, initialize, initialized } = useAuthStore();
  const { loadPlaylists } = usePlaylistStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (initialized) {
      loadPlaylists(!!user);
    }
  }, [initialized, user, loadPlaylists]);

  if (!initialized) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public shared playlist — no layout chrome */}
      <Route path="/playlist/:id" element={<PublicPlaylistPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* Main app layout */}
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/playlists" element={<PlaylistsPage />} />
        <Route path="/playlists/:id" element={<PlaylistDetailPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
