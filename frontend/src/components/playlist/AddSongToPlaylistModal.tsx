import { useState, useEffect } from 'react';
import { X, Search, Plus, Check } from 'lucide-react';
import { useLibraryStore } from '../../store/libraryStore';
import { Thumbnail } from '../shared/Thumbnail';
import { formatDuration } from '../../lib/utils';
import type { Song } from '../../types';

interface AddSongToPlaylistModalProps {
  existingSongIds: string[];
  onAdd: (songId: string) => Promise<void>;
  onClose: () => void;
}

export function AddSongToPlaylistModal({
  existingSongIds,
  onAdd,
  onClose,
}: AddSongToPlaylistModalProps) {
  const { songs: allSongs, loadSongs, searchQuery, setSearchQuery, getFilteredSongs } = useLibraryStore();
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set(existingSongIds));

  useEffect(() => {
    // Ensure songs are loaded
    if (allSongs.length === 0) {
      loadSongs(true); // Assuming authenticated since playlists are an auth feature
    }
  }, [allSongs.length, loadSongs]);

  const filteredSongs = getFilteredSongs().filter(s => !existingSongIds.includes(s.id));

  const handleAdd = async (songId: string) => {
    if (addingIds.has(songId) || addedIds.has(songId)) return;
    
    setAddingIds(prev => new Set(prev).add(songId));
    try {
      await onAdd(songId);
      setAddedIds(prev => new Set(prev).add(songId));
    } catch (err) {
      console.error('Failed to add song to playlist:', err);
    } finally {
      setAddingIds(prev => {
        const next = new Set(prev);
        next.delete(songId);
        return next;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-[#111111] border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-text">Add a song</h2>
            <p className="text-sm text-textMuted mt-1">Select songs from your library to add</p>
          </div>
          <button
            onClick={onClose}
            className="text-textMuted hover:text-text transition-colors p-2 hover:bg-surface rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-border">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
            <input
              type="text"
              placeholder="Search your library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text placeholder-textMuted focus:outline-none focus:border-accent transition-colors"
              autoFocus
            />
          </div>
        </div>

        {/* Song List */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredSongs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-textSecondary text-sm font-medium">No results found</p>
              <p className="text-textMuted text-xs mt-1">Try a different search term or add more songs to your library.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredSongs.map((song) => {
                const isAdding = addingIds.has(song.id);
                const isAdded = addedIds.has(song.id);

                return (
                  <div
                    key={song.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface transition-colors group"
                  >
                    <Thumbnail src={song.thumbnail_url} alt={song.title} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate">{song.title}</p>
                      <p className="text-xs text-textMuted truncate mt-0.5">{song.artist || 'Unknown'}</p>
                    </div>
                    <span className="text-xs text-textMuted font-mono tabular-nums">
                      {formatDuration(song.duration_seconds)}
                    </span>
                    <button
                      onClick={() => handleAdd(song.id)}
                      disabled={isAdding || isAdded}
                      className={`
                        w-10 h-10 flex items-center justify-center rounded-full transition-all
                        ${isAdded 
                          ? 'bg-accent/10 text-accent cursor-default' 
                          : 'bg-surface group-hover:bg-accent group-hover:text-black text-textMuted'
                        }
                        ${isAdding ? 'animate-pulse' : ''}
                      `}
                    >
                      {isAdded ? <Check size={18} /> : <Plus size={18} />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-[#0d0d0d] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-accent hover:bg-accentHover text-black font-semibold text-sm rounded-full transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
