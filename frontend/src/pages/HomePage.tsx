import { useEffect, useState } from 'react';
import { Play, Plus, Trash2, Heart, Music, Star, Search, Sparkles, UserPlus } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useLibraryStore } from '../store/libraryStore';
import { usePlayerStore } from '../store/playerStore';
import { usePlaylistStore } from '../store/playlistStore';
import { SongCard } from '../components/shared/SongCard';
import { ListenOnlineSearch } from '../components/shared/ListenOnlineSearch';
import { ArtistSearch } from '../components/shared/ArtistSearch';
import type { Song } from '../types';
import { ChevronRight } from 'lucide-react';

import { useUIStore } from '../store/uiStore';

export default function HomePage() {
  const { user } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const {
    songs,
    recentlyListened,
    favoriteArtists,
    blacklistedRecommendations,
    loadSongs,
    deleteSong,
    removeFromRecentlyListened,
    blacklistRecommendation,
    addFavoriteArtist,
    removeFavoriteArtist,
    toggleLikeSong,
  } = useLibraryStore();

  const { playSong } = usePlayerStore();
  const { playlists, addSongToPlaylist, loadPlaylists } = usePlaylistStore();
  const [showAddArtist, setShowAddArtist] = useState(false);
  const [activeMenu, setActiveMenu] = useState<{ id: string; x: number; y: number; section: string } | null>(null);

  useEffect(() => {
    loadSongs(!!user);
    loadPlaylists(!!user);
  }, [user, loadSongs, loadPlaylists]);


  const likedSongs = songs.filter(s => s.is_liked);

  
  // Basic recommendation logic: prefer favorite artists, else random, exclude blacklisted
  const recommendations = songs
    .filter(s => !blacklistedRecommendations.includes(s.id))
    .sort((a, b) => {
      const aFav = favoriteArtists.some(fa => a.artist?.toLowerCase().includes(fa.name.toLowerCase()));
      const bFav = favoriteArtists.some(fa => b.artist?.toLowerCase().includes(fa.name.toLowerCase()));
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return Math.random() - 0.5;
    })
    .slice(0, 10);

  const handleMenuClick = (e: React.MouseEvent, songId: string, section: string) => {
    e.stopPropagation();
    setActiveMenu({ id: songId, x: e.clientX, y: e.clientY, section });
  };

  const handleRemove = (id: string, section: string) => {
    if (section === 'liked') {
      deleteSong(id, !!user);
    } else if (section === 'recent') {
      removeFromRecentlyListened(id);
    } else if (section === 'recommended') {
      blacklistRecommendation(id);
    }
    setActiveMenu(null);
  };

  const Section = ({ title, icon: Icon, children, action }: { title: string; icon: any; children: React.ReactNode; action?: React.ReactNode }) => (
    <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
            <Icon size={24} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-text">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </div>
  );

  const EmptyState = ({ message, icon: Icon }: { message: string, icon: any }) => (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-surface/30 rounded-2xl border border-dashed border-white/5">
      <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-textMuted mb-4">
        <Icon size={24} />
      </div>
      <p className="text-textMuted text-center max-w-xs">{message}</p>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 bg-gradient-to-b from-background via-surface to-background custom-scrollbar">
      {/* Hero / Search */}
      <div className="relative mb-16 text-center pt-8">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-accent/20 blur-[120px] rounded-full -z-10" />
        <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-white to-textMuted bg-clip-text text-transparent">
          {user ? 'Welcome back to Melodex' : 'Sync your music everywhere'}
        </h1>
        <p className="text-textMuted text-lg mb-12 max-w-2xl mx-auto">
          {user 
            ? 'Explore millions of tracks, sync your library, and listen anywhere.' 
            : 'Join Melodex to save your favorites, create playlists, and build your personalized music home.'}
        </p>
        <ListenOnlineSearch />

        {!user && (
          <div className="mt-8 flex justify-center animate-in fade-in zoom-in-95 duration-500 delay-200">
            <div className="p-6 bg-surface/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl max-w-xl">
              <h3 className="text-xl font-bold mb-2">Ready to start your journey?</h3>
              <p className="text-textMuted mb-6 text-sm">
                Create an account to unlock liked songs, listening history, and personal recommendations.
              </p>
              <button 
                onClick={openAuthModal}
                className="px-8 py-3 bg-accent hover:bg-accentHover text-black font-bold rounded-full transition-all hover:scale-105 active:scale-95 shadow-xl shadow-accent/20"
              >
                Get Started for Free
              </button>
            </div>
          </div>
        )}
      </div>

      {user ? (
        <>
          {/* Liked Songs */}
          <Section title="Liked Songs" icon={Heart}>
            {likedSongs.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {likedSongs.map(song => (
                  <SongCard key={song.id} song={song} queue={likedSongs} onMenuClick={(e) => handleMenuClick(e, song.id, 'liked')} />
                ))}
              </div>
            ) : (
              <EmptyState message="Explore and like some songs first!" icon={Plus} />
            )}
          </Section>

          {/* Recently Listened */}
          <Section title="Recently Listened" icon={Music}>
            {recentlyListened.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {recentlyListened.map(song => (
                  <SongCard key={song.id} song={song} onMenuClick={(e) => handleMenuClick(e, song.id, 'recent')} />
                ))}
              </div>
            ) : (
              <EmptyState message="No recently listened songs." icon={Music} />
            )}
          </Section>

          {/* Recommended */}
          <Section title="You May Like" icon={Sparkles}>
            {recommendations.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {recommendations.map(song => (
                  <SongCard key={song.id} song={song} onMenuClick={(e) => handleMenuClick(e, song.id, 'recommended')} />
                ))}
              </div>
            ) : (
              <EmptyState message="Add more songs to your library to get recommendations." icon={Sparkles} />
            )}
          </Section>
        </>
      ) : null}

      {/* Context Menu Overlay */}
      {activeMenu && (
        <div className="fixed inset-0 z-[100]" onClick={() => setActiveMenu(null)}>
          <div 
            className="absolute bg-surface/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl py-1.5 min-w-[200px] animate-in fade-in zoom-in-95 duration-100"
            style={{ 
              top: Math.min(window.innerHeight - 300, activeMenu.y), 
              left: Math.min(window.innerWidth - 210, activeMenu.x) 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
               const s = songs.find(s => s.id === activeMenu.id) || recentlyListened.find(s => s.id === activeMenu.id);
               if (!s) return null;
               const isLiked = s?.is_liked;
               return (
                 <>
                   <div className="px-4 py-2 text-[10px] uppercase tracking-widest text-textMuted font-bold border-b border-white/5 mb-1.5">
                     Options
                   </div>

                   {/* Like Option */}
                   <button 
                    onClick={() => {
                      toggleLikeSong(s, !!user);
                      setActiveMenu(null);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text hover:bg-white/10 transition-colors"
                   >
                     <div className={`w-6 h-6 ${isLiked ? 'bg-accent/10 text-accent' : 'bg-white/10 text-textMuted'} rounded-lg flex items-center justify-center`}>
                       <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
                     </div>
                     {isLiked ? 'Unlike' : 'Like'}
                   </button>
                 </>
               );
            })()}


            {/* Add to Playlist Submenu */}

            <div className="relative group/playlist">
              <button 
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-text hover:bg-white/10 transition-colors"
                onMouseEnter={() => {/* Pre-fetch playlist songs if needed */}}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-accent/10 rounded-lg flex items-center justify-center text-accent">
                    <Plus size={14} />
                  </div>
                  Add to Playlist
                </div>
                <ChevronRight size={14} className="text-textMuted group-hover/playlist:translate-x-0.5 transition-transform" />
              </button>
              
              <div className="absolute left-full top-0 ml-1.5 hidden group-hover/playlist:block bg-surface/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl py-1.5 min-w-[200px] max-h-[300px] overflow-y-auto custom-scrollbar animate-in slide-in-from-left-2 duration-150">
                {playlists.length > 0 ? (
                  playlists.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => {
                        addSongToPlaylist(p.id, activeMenu.id, !!user);
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-textMuted hover:text-text hover:bg-white/5 transition-colors flex items-center gap-3"
                    >
                      <Music size={14} className="opacity-50" />
                      <span className="truncate">{p.name}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-textMuted text-xs italic">
                    No playlists found. Create one first!
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={() => handleRemove(activeMenu.id, activeMenu.section)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-white/10 transition-colors mt-1 border-t border-white/5 pt-2"
            >
              <div className="w-6 h-6 bg-red-500/10 rounded-lg flex items-center justify-center">
                <Trash2 size={14} />
              </div>
              Remove
            </button>
          </div>
        </div>
      )}


      {/* Favourite Artists */}
      <Section 
        title="Favourite Artists" 
        icon={Star}
        action={
          <button 
            onClick={() => setShowAddArtist(!showAddArtist)}
            className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surfaceHover text-text text-sm font-medium rounded-full border border-white/10 transition-colors"
          >
            <UserPlus size={16} />
            Add Artist
          </button>
        }
      >
        <div className="flex flex-wrap gap-4">
          {showAddArtist && (
             <ArtistSearch onAdd={() => setShowAddArtist(false)} />
          )}

          {favoriteArtists.length > 0 ? (
            favoriteArtists.map((artist, idx) => (
              <div key={idx} className="group relative flex items-center gap-3 px-6 py-4 bg-surface/50 border border-white/5 rounded-2xl hover:bg-surfaceHover hover:border-accent/30 transition-all duration-300">
                <div className="w-12 h-12 bg-accent/10 rounded-full overflow-hidden flex items-center justify-center text-accent border border-accent/20">
                  {artist.image_url ? (
                    <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover" />
                  ) : (
                    artist.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-text">{artist.name}</h4>
                  <p className="text-[10px] text-textMuted uppercase tracking-widest font-bold">Artist</p>
                </div>
                <button
                  onClick={() => removeFavoriteArtist(artist.name)}
                  className="p-1.5 text-textMuted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          ) : !showAddArtist && (
            <EmptyState message="No favourite artists added." icon={Star} />
          )}
        </div>
      </Section>
    </div>
  );
}

function EmptyState({ message, icon: Icon }: { message: string; icon: any }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-surface/30 rounded-3xl border border-white/5 border-dashed">
      <div className="w-12 h-12 bg-textMuted/10 rounded-full flex items-center justify-center text-textMuted/50 mb-4">
        <Icon size={24} />
      </div>
      <p className="text-textMuted text-center font-medium max-w-xs">{message}</p>
    </div>
  );
}
