import { Play, MoreHorizontal, Clock } from 'lucide-react';
import type { Song } from '../../types';
import { Thumbnail } from './Thumbnail';
import { formatDuration } from '../../lib/utils';
import { usePlayerStore } from '../../store/playerStore';

interface SongCardProps {
  song: Song;
  onMenuClick?: (e: React.MouseEvent) => void;
  queue?: Song[];
}

export function SongCard({ song, onMenuClick, queue }: SongCardProps) {
  const { currentSong, isPlaying, playSong } = usePlayerStore();
  const isCurrent = currentSong?.id === song.id;

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSong(song, queue);
  };

  return (
    <div 
      className="group bg-surface hover:bg-surfaceHover p-4 rounded-xl transition-all duration-300 cursor-pointer relative"
      onClick={handlePlay}
    >
      <div className="relative aspect-square mb-4 rounded-lg overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow">
        <Thumbnail 
          src={song.thumbnail_url} 
          alt={song.title} 
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" 
        />
        
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button 
            className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-black transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-xl"
          >
            {isCurrent && isPlaying ? (
              <div className="flex gap-1 items-end h-4">
                <div className="w-1 bg-black animate-music-bar-1" />
                <div className="w-1 bg-black animate-music-bar-2" />
                <div className="w-1 bg-black animate-music-bar-3" />
              </div>
            ) : (
              <Play fill="currentColor" size={20} className="ml-1" />
            )}
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <h3 className={`font-semibold truncate text-sm sm:text-base ${isCurrent ? 'text-accent' : 'text-text'}`}>
          {song.title}
        </h3>
        <p className="text-textMuted text-xs sm:text-sm truncate">
          {song.artist || 'Unknown Artist'}
        </p>
      </div>

      <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onMenuClick?.(e);
          }}
          className="p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      {song.duration_seconds && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-textMuted font-medium uppercase tracking-wider">
          <Clock size={10} />
          {formatDuration(song.duration_seconds)}
        </div>
      )}
    </div>
  );
}
