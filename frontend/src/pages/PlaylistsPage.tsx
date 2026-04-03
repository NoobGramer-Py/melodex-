import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePlaylists } from '../hooks/usePlaylists';
import { useUIStore } from '../store/uiStore';
import { PlaylistCard } from '../components/playlist/PlaylistCard';
import { PlaylistModal } from '../components/playlist/PlaylistModal';
import { GridCardSkeleton } from '../components/shared/Skeleton';
import type { Playlist } from '../types';

export default function PlaylistsPage() {
  const navigate = useNavigate();
  const { playlists, loading, createPlaylist, updatePlaylist, deletePlaylist } = usePlaylists();
  const [showCreate, setShowCreate] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const { showConfirm } = useUIStore();

  const handleCreate = async (name: string, isPublic: boolean) => {
    await createPlaylist(name, isPublic);
    setShowCreate(false);
  };

  const handleEdit = async (name: string, isPublic: boolean) => {
    if (!editingPlaylist) return;
    await updatePlaylist(editingPlaylist.id, { name, is_public: isPublic });
    setEditingPlaylist(null);
  };

  const handleDelete = async (id: string) => {
    showConfirm({
      title: 'Delete Playlist?',
      message: 'This will permanently remove the playlist and all its contents. This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        await deletePlaylist(id);
      },
    });
  };

  const handleCopyLink = async (id: string) => {
    const url = `${window.location.origin}/playlist/${id}`;
    await navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 py-5 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-text">Playlists</h1>
            <p className="text-sm text-textMuted mt-0.5">
              {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accentHover text-black text-sm font-medium rounded-full transition-colors"
          >
            <Plus size={16} />
            New Playlist
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <GridCardSkeleton key={i} />)}
          </div>
        ) : playlists.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <p className="text-textSecondary">No playlists yet</p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-5 py-2.5 bg-accent hover:bg-accentHover text-black text-sm font-medium rounded-full transition-colors"
            >
              Create your first playlist
            </button>
          </div>
        ) : (
          <>
            {copied && (
              <div className="fixed top-4 right-4 z-50 bg-accent text-black text-sm font-medium px-4 py-2.5 rounded-full shadow-lg animate-fade-in">
                Link copied!
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {playlists.map(pl => (
                <PlaylistCard
                  key={pl.id}
                  playlist={pl}
                  onClick={() => navigate(`/playlists/${pl.id}`)}
                  onEdit={() => setEditingPlaylist(pl)}
                  onDelete={() => handleDelete(pl.id)}
                  onCopyLink={pl.is_public ? () => handleCopyLink(pl.id) : undefined}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {showCreate && (
        <PlaylistModal
          onSubmit={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}

      {editingPlaylist && (
        <PlaylistModal
          playlist={editingPlaylist}
          onSubmit={handleEdit}
          onClose={() => setEditingPlaylist(null)}
        />
      )}
    </div>
  );
}
