import { NavLink, useNavigate } from 'react-router-dom';
import {
  Library,
  ListMusic,
  PlusCircle,
  LogIn,
  LogOut,
  User,
  Music2,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { usePlaylists } from '../../hooks/usePlaylists';

export function Sidebar() {
  const { user, signOut } = useAuthStore();
  const { openAuthModal, openAddSongModal } = useUIStore();
  const { playlists } = usePlaylists();
  const navigate = useNavigate();

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
      isActive
        ? 'bg-surfaceHover text-text font-medium'
        : 'text-textSecondary hover:text-text hover:bg-surface'
    }`;

  return (
    <aside className="w-60 flex-shrink-0 bg-[#0d0d0d] border-r border-border flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2.5">
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
          <Music2 size={18} className="text-black" />
        </div>
        <span className="font-semibold text-base tracking-tight text-text">Melodex</span>
      </div>

      {/* Nav */}
      <nav className="px-3 space-y-1">
        <NavLink to="/library" className={navClass}>
          <Library size={18} />
          Library
        </NavLink>
        <NavLink to="/playlists" className={navClass}>
          <ListMusic size={18} />
          Playlists
        </NavLink>
      </nav>

      {/* Add Song button */}
      <div className="px-3 mt-4">
        <button
          onClick={openAddSongModal}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-textSecondary hover:text-text hover:bg-surface transition-colors"
        >
          <PlusCircle size={18} className="text-accent" />
          Add Song
        </button>
      </div>

      {/* Playlists list */}
      {playlists.length > 0 && (
        <div className="mt-5 flex-1 overflow-y-auto min-h-0">
          <p className="px-5 text-xs font-medium text-textMuted uppercase tracking-widest mb-2">
            Playlists
          </p>
          <div className="px-3 space-y-0.5">
            {playlists.map(pl => (
              <button
                key={pl.id}
                onClick={() => navigate(`/playlists/${pl.id}`)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-textSecondary hover:text-text hover:bg-surface transition-colors truncate"
              >
                {pl.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1" />

      {/* User / Auth */}
      <div className="px-3 pb-4 border-t border-border pt-3">
        {user ? (
          <div className="space-y-1">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="avatar"
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <div className="w-7 h-7 bg-accent/20 rounded-full flex items-center justify-center">
                  <User size={14} className="text-accent" />
                </div>
              )}
              <span className="text-sm text-text truncate flex-1">
                {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </span>
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-textSecondary hover:text-text hover:bg-surface transition-colors"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={openAuthModal}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-textSecondary hover:text-text hover:bg-surface transition-colors"
          >
            <LogIn size={18} className="text-accent" />
            Sign in
          </button>
        )}
      </div>
    </aside>
  );
}
