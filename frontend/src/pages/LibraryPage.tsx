import { useEffect, useState } from 'react';
import { Search, SortAsc, SortDesc, PlusCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useLibraryStore } from '../store/libraryStore';
import { useUIStore } from '../store/uiStore';
import { SongRow } from '../components/library/SongRow';
import { SongCardSkeleton } from '../components/shared/Skeleton';
import { usePlaylists } from '../hooks/usePlaylists';
import type { SortOption } from '../types';

export default function LibraryPage() {
  const { user } = useAuthStore();
  const {
    loading,
    sort,
    order,
    searchQuery,
    loadSongs,
    deleteSong,
    setSort,
    setOrder,
    setSearchQuery,
    getFilteredSongs,
  } = useLibraryStore();
  const { openAddSongModal, showConfirm } = useUIStore();
  const { playlists, addSongToPlaylist } = usePlaylists();

  useEffect(() => {
    loadSongs(!!user);
  }, [user, loadSongs]);

  const songs = getFilteredSongs();

  const handleSortChange = (newSort: SortOption) => {
    if (newSort === sort) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(newSort);
      setOrder('desc');
    }
  };

  const handleDelete = async (id: string) => {
    const song = songs.find(s => s.id === id);
    showConfirm({
      title: 'Remove Song?',
      message: `Are you sure you want to remove "${song?.title}" from your library?`,
      confirmLabel: 'Remove',
      destructive: true,
      onConfirm: async () => {
        await deleteSong(id, !!user);
      },
    });
  };

  const SortButton = ({ label, value }: { label: string; value: SortOption }) => (
    <button
      onClick={() => handleSortChange(value)}
      className={`flex items-center gap-1 text-xs font-medium transition-colors px-2 py-1 rounded ${
        sort === value ? 'text-accent' : 'text-textMuted hover:text-text'
      }`}
    >
      {label}
      {sort === value && (order === 'asc' ? <SortAsc size={12} /> : <SortDesc size={12} />)}
    </button>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-text">Your Library</h1>
            <p className="text-sm text-textMuted mt-0.5">
              {songs.length} {songs.length === 1 ? 'song' : 'songs'}
            </p>
          </div>
          <button
            onClick={openAddSongModal}
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accentHover text-black text-sm font-medium rounded-full transition-colors"
          >
            <PlusCircle size={16} />
            Add Song
          </button>
        </div>

        {/* Search + Sort */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
            <input
              type="text"
              placeholder="Search songs…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text placeholder-textMuted focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-xs text-textMuted mr-1">Sort:</span>
            <SortButton label="Date" value="created_at" />
            <SortButton label="Title" value="title" />
            <SortButton label="Artist" value="artist" />
          </div>
        </div>
      </div>

      {/* Song list */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {loading ? (
          <div className="space-y-1">
            {Array.from({ length: 8 }).map((_, i) => <SongCardSkeleton key={i} />)}
          </div>
        ) : songs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            {searchQuery ? (
              <>
                <p className="text-textSecondary">No songs match "{searchQuery}"</p>
                <button onClick={() => setSearchQuery('')} className="text-accent text-sm hover:underline">
                  Clear search
                </button>
              </>
            ) : (
              <>
                <p className="text-textSecondary">Your library is empty</p>
                <button
                  onClick={openAddSongModal}
                  className="px-5 py-2.5 bg-accent hover:bg-accentHover text-black text-sm font-medium rounded-full transition-colors"
                >
                  Add your first song
                </button>
              </>
            )}
          </div>
        ) : (
          <div>
            {/* Column headers */}
            <div className="flex items-center gap-3 px-3 pb-2 border-b border-border mb-1">
              <div className="w-8" />
              <div className="w-12 flex-shrink-0" />
              <div className="flex-1 text-xs text-textMuted uppercase tracking-wider">Title</div>
              <div className="text-xs text-textMuted uppercase tracking-wider hidden md:block w-24 text-right">
                Added
              </div>
              <div className="text-xs text-textMuted uppercase tracking-wider w-10 text-right">
                Time
              </div>
              <div className="w-8" />
            </div>

            {songs.map((song, i) => (
              <SongRow
                key={song.id}
                song={song}
                index={i}
                queue={songs}
                playlists={playlists}
                onDelete={handleDelete}
                onAddToPlaylist={addSongToPlaylist}
                showDateAdded
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
