import { useEffect, useState } from 'react';
import { Play, Plus, Trash2, Heart, Music, Star, Search, Sparkles, UserPlus } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useLibraryStore } from '../store/libraryStore';
import { usePlayerStore } from '../store/playerStore';
import { SongCard } from '../components/shared/SongCard';
import { ListenOnlineSearch } from '../components/shared/ListenOnlineSearch';
import { ArtistSearch } from '../components/shared/ArtistSearch';
import type { Song } from '../types';

export default function HomePage() {
  const { user } = useAuthStore();
  const {
    songs,
    recentlyListened,
    favoriteArtists,
    loadSongs,
    removeFromRecentlyListened,
    addFavoriteArtist,
    removeFavoriteArtist,
  } = useLibraryStore();
  const { playSong } = usePlayerStore();
  const [showAddArtist, setShowAddArtist] = useState(false);

  useEffect(() => {
    loadSongs(!!user);
  }, [user, loadSongs]);

  const likedSongs = songs.slice(0, 10);
  
  // Basic recommendation logic: prefer favorite artists, else random
  const recommendations = [...songs].sort((a, b) => {
    const aFav = favoriteArtists.some(fa => a.artist?.toLowerCase().includes(fa.name.toLowerCase()));
    const bFav = favoriteArtists.some(fa => b.artist?.toLowerCase().includes(fa.name.toLowerCase()));
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    return Math.random() - 0.5;
  }).slice(0, 10);

  const Section = ({ title, icon: Icon, children, action }: { title: string; icon: any; children: React.ReactNode; action?: React.ReactNode }) => (
    <div className="mb-12">
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

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 bg-gradient-to-b from-background via-surface to-background custom-scrollbar">
      {/* Hero / Search */}
      <div className="relative mb-16 text-center pt-8">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-accent/20 blur-[120px] rounded-full -z-10" />
        <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-white to-textMuted bg-clip-text text-transparent">
          Welcome back to Melodex
        </h1>
        <p className="text-textMuted text-lg mb-12 max-w-2xl mx-auto">
          Explore millions of tracks, sync your library, and listen anywhere.
        </p>
        <ListenOnlineSearch />
      </div>

      {/* Liked Songs */}
      <Section title="Liked Songs" icon={Heart}>
        {likedSongs.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {likedSongs.map(song => (
              <SongCard key={song.id} song={song} queue={likedSongs} />
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
              <div key={song.id} className="relative group">
                <SongCard song={song} />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromRecentlyListened(song.id);
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-500/20 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/40"
                  title="Remove from recent"
                >
                  <Trash2 size={16} />
                </button>
              </div>
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
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        ) : (
          <EmptyState message="Add more songs to your library to get recommendations." icon={Sparkles} />
        )}
      </Section>

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
