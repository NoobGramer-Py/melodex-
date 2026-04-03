import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Play, Trash2, ListPlus, Pause } from 'lucide-react';
import type { Song, Playlist } from '../../types';
import { Thumbnail } from '../shared/Thumbnail';
import { formatDuration, formatDate } from '../../lib/utils';
import { usePlayerStore } from '../../store/playerStore';

interface SongRowProps {
  song: Song;
  index?: number;
  queue?: Song[];
  playlists?: Playlist[];
  onDelete?: (id: string) => void;
  onAddToPlaylist?: (playlistId: string, songId: string) => void;
  showDateAdded?: boolean;
}

export function SongRow({
  song,
  index,
  queue,
  playlists = [],
  onDelete,
  onAddToPlaylist,
  showDateAdded = false,
}: SongRowProps) {
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayerStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [playlistMenuOpen, setPlaylistMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isCurrentSong = currentSong?.id === song.id;

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setPlaylistMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handlePlay = () => {
    if (isCurrentSong) {
      togglePlay();
    } else {
      playSong(song, queue);
    }
  };

  return (
    <div
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
        isCurrentSong ? 'bg-surfaceHover' : 'hover:bg-surface'
      }`}
      onDoubleClick={handlePlay}
    >
      {/* Index / Play icon */}
      <div className="w-8 flex-shrink-0 flex items-center justify-center">
        {isCurrentSong && isPlaying ? (
          <button onClick={handlePlay} className="text-accent">
            <Pause size={16} fill="currentColor" />
          </button>
        ) : (
          <>
            <span className="group-hover:hidden text-xs text-textMuted font-mono tabular-nums">
              {index !== undefined ? index + 1 : ''}
            </span>
            <button onClick={handlePlay} className="hidden group-hover:flex text-text">
              <Play size={16} fill="currentColor" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail */}
      <Thumbnail src={song.thumbnail_url} alt={song.title} size="sm" />

      {/* Title + Artist */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium line-clamp-1 ${isCurrentSong ? 'text-accent' : 'text-text'}`}>
          {song.title}
        </p>
        <p className="text-xs text-textMuted line-clamp-1 mt-0.5">
          {song.artist || 'Unknown'}
        </p>
      </div>

      {/* Date added */}
      {showDateAdded && (
        <span className="text-xs text-textMuted hidden md:block w-24 text-right">
          {formatDate(song.created_at)}
        </span>
      )}

      {/* Duration */}
      <span className="text-xs text-textMuted font-mono tabular-nums w-10 text-right">
        {formatDuration(song.duration_seconds)}
      </span>

      {/* Context menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          className="opacity-0 group-hover:opacity-100 text-textMuted hover:text-text transition-all p-1 rounded"
        >
          <MoreHorizontal size={16} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-8 z-20 w-44 bg-[#1a1a1a] border border-border rounded-xl shadow-xl overflow-hidden animate-fade-in">
            <button
              onClick={() => { handlePlay(); setMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-surfaceHover transition-colors text-left"
            >
              <Play size={14} />
              Play
            </button>

            {playlists.length > 0 && onAddToPlaylist && (
              <div className="relative">
                <button
                  onMouseEnter={() => setPlaylistMenuOpen(true)}
                  onMouseLeave={() => setPlaylistMenuOpen(false)}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-surfaceHover transition-colors text-left"
                >
                  <ListPlus size={14} />
                  add song in the playlist
                </button>

                {playlistMenuOpen && (
                  <div
                    className="absolute right-full top-0 w-44 bg-[#1a1a1a] border border-border rounded-xl shadow-xl overflow-hidden"
                    onMouseEnter={() => setPlaylistMenuOpen(true)}
                    onMouseLeave={() => setPlaylistMenuOpen(false)}
                  >
                    {playlists.map(pl => (
                      <button
                        key={pl.id}
                        onClick={() => { onAddToPlaylist(pl.id, song.id); setMenuOpen(false); setPlaylistMenuOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-text hover:bg-surfaceHover transition-colors truncate"
                      >
                        {pl.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {onDelete && (
              <>
                <div className="h-px bg-border mx-2 my-1" />
                <button
                  onClick={() => { onDelete(song.id); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-surfaceHover transition-colors text-left"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
