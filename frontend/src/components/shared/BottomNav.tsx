import { NavLink } from 'react-router-dom';
import { 
  Library, 
  ListMusic, 
  PlusCircle, 
  User 
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

export function BottomNav() {
  const { user } = useAuthStore();
  const { openAuthModal, openAddSongModal } = useUIStore();

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-1.5 px-3 py-2 text-[10px] uppercase font-bold tracking-wider transition-colors ${
      isActive ? 'text-accent' : 'text-textMuted hover:text-text'
    }`;

  return (
    <nav className="lg:hidden h-16 border-t border-border bg-[#0d0d0d] flex items-center justify-around px-2 z-50">
      <NavLink to="/library" className={navClass}>
        <Library size={20} />
        Library
      </NavLink>
      
      <NavLink to="/playlists" className={navClass}>
        <ListMusic size={20} />
        Playlists
      </NavLink>

      <button onClick={openAddSongModal} className="flex flex-col items-center gap-1.5 px-3 py-2 text-[10px] uppercase font-bold tracking-wider text-textMuted hover:text-text">
        <PlusCircle size={24} className="text-accent" />
        Add
      </button>

      {user ? (
        <NavLink to="/library" className={navClass}>
           {user.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt="avatar"
              className="w-5 h-5 rounded-full object-cover"
            />
          ) : (
            <div className="w-5 h-5 bg-accent/20 rounded-full flex items-center justify-center">
              <User size={14} className="text-accent" />
            </div>
          )}
          Me
        </NavLink>
      ) : (
        <button onClick={openAuthModal} className="flex flex-col items-center gap-1.5 px-3 py-2 text-[10px] uppercase font-bold tracking-wider text-textMuted hover:text-text">
          <User size={20} />
          Login
        </button>
      )}
    </nav>
  );
}
