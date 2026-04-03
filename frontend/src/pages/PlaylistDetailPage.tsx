import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Globe,
  Lock,
  Play,
  Shuffle,
  Link,
  Pencil,
  GripVertical,
  Trash2,
  Plus,
  Heart,
} from 'lucide-react';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { usePlaylists } from '../hooks/usePlaylists';
import { usePlayerStore } from '../store/playerStore';
import { useLibraryStore } from '../store/libraryStore';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';

import { PlaylistModal } from '../components/playlist/PlaylistModal';
import { AddSongToPlaylistModal } from '../components/playlist/AddSongToPlaylistModal';
import { Thumbnail } from '../components/shared/Thumbnail';
import { SongCardSkeleton } from '../components/shared/Skeleton';
import { formatDuration, totalDuration } from '../lib/utils';
import type { Song, Playlist } from '../types';

function SortableSongRow({
  song,
  index,
  isOwner,
  onRemove,
  onPlay,
  isCurrentSong,
  toggleLikeSong,
  user,
}: {
  song: Song;
  index: number;
  isOwner: boolean;
  onRemove: (id: string) => void;
  onPlay: (song: Song) => void;
  isCurrentSong: boolean;
  toggleLikeSong: (song: Song, isAuthenticated: boolean) => Promise<void>;
  user: any;
}) {



  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: song.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
        isCurrentSong ? 'bg-surfaceHover' : 'hover:bg-surface'
      }`}
    >
      {isOwner && (
        <button
          {...attributes}
          {...listeners}
          className="text-textMuted opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity flex-shrink-0"
        >
          <GripVertical size={16} />
        </button>
      )}

      <span className="text-xs text-textMuted font-mono w-5 text-right flex-shrink-0">
        {index + 1}
      </span>

      <Thumbnail src={song.thumbnail_url} alt={song.title} size="sm" />

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium line-clamp-1 cursor-pointer hover:underline ${
            isCurrentSong ? 'text-accent' : 'text-text'
          }`}
          onClick={() => onPlay(song)}
        >
          {song.title}
        </p>
        <p className="text-xs text-textMuted mt-0.5">{song.artist || 'Unknown'}</p>
      </div>

      <span className="text-xs text-textMuted font-mono tabular-nums">
        {formatDuration(song.duration_seconds)}
      </span>

      <button 
        onClick={(e) => { e.stopPropagation(); toggleLikeSong(song, !!user); }}
        className={`transition-colors p-1 rounded-full ${song.is_liked ? 'text-accent opacity-100' : 'text-textMuted hover:text-text opacity-0 group-hover:opacity-100'}`}
      >

        <Heart size={16} fill={song.is_liked ? 'currentColor' : 'none'} />
      </button>


      {isOwner && (
        <button
          onClick={() => onRemove(song.id)}
          className="opacity-0 group-hover:opacity-100 text-textMuted hover:text-red-400 transition-all p-1 rounded"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPlaylistWithSongs, updatePlaylist, removeSongFromPlaylist, reorderSongs, addSongToPlaylist, deletePlaylist } = usePlaylists();
  const { playSong, toggleShuffle, shuffle } = usePlayerStore();
  const { showConfirm } = useUIStore();

  const { user } = useAuthStore();
  const { toggleLikeSong } = useLibraryStore();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);

  const [songs, setSongs] = useState<Song[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [addSongOpen, setAddSongOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { currentSong } = usePlayerStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const result = await getPlaylistWithSongs(id);
    if (!result) {
      if (id) navigate('/playlists');
      return;
    }
    setPlaylist(result.playlist);
    setSongs(result.songs);
    setIsOwner(result.is_owner);
    setLoading(false);
  }, [id, getPlaylistWithSongs, navigate]);

  const handleAddSong = async (songId: string) => {
    if (!id) return;
    await addSongToPlaylist(id, songId);
    // Reload songs locally after adding
    const result = await getPlaylistWithSongs(id);
    if (result) setSongs(result.songs);
  };

  useEffect(() => { load(); }, [load]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = songs.findIndex(s => s.id === active.id);
    const newIndex = songs.findIndex(s => s.id === over.id);
    const reordered = arrayMove(songs, oldIndex, newIndex);
    setSongs(reordered);

    const order = reordered.map((s, i) => ({ song_id: s.id, position: i }));
    await reorderSongs(id!, order);
  };

  const handleRemoveSong = async (songId: string) => {
    const song = songs.find(s => s.id === songId);
    showConfirm({
      title: 'Remove from Playlist?',
      message: `Remove "${song?.title}" from this playlist?`,
      confirmLabel: 'Remove',
      destructive: true,
      onConfirm: async () => {
        await removeSongFromPlaylist(id!, songId);
        setSongs(prev => prev.filter(s => s.id !== songId));
      },
    });
  };

  const handleDeletePlaylist = async () => {
    showConfirm({
      title: 'Delete Playlist?',
      message: `Are you sure you want to delete "${playlist?.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        await deletePlaylist(id!);
        navigate('/playlists');
      },
    });
  };

  const handleEdit = async (name: string, isPublic: boolean) => {
    await updatePlaylist(id!, { name, is_public: isPublic });
    setPlaylist(prev => prev ? { ...prev, name, is_public: isPublic } : null);
  };

  const handlePlayAll = () => {
    if (songs.length > 0) playSong(songs[0], songs);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/playlist/${id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-6 w-32 bg-surface rounded animate-skeleton-pulse" />
        <div className="flex gap-5 mt-4">
          <div className="w-40 h-40 bg-surface rounded-xl animate-skeleton-pulse" />
          <div className="space-y-3 flex-1 pt-2">
            <div className="h-8 w-48 bg-surface rounded animate-skeleton-pulse" />
            <div className="h-4 w-32 bg-surface rounded animate-skeleton-pulse" />
          </div>
        </div>
        <div className="mt-6 space-y-1">
          {Array.from({ length: 5 }).map((_, i) => <SongCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (!playlist) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 flex-shrink-0">
        <button
          onClick={() => navigate('/playlists')}
          className="flex items-center gap-2 text-sm text-textMuted hover:text-text transition-colors mb-5"
        >
          <ArrowLeft size={16} />
          Back to playlists
        </button>

        <div className="flex flex-col md:flex-row items-center md:items-end gap-5">
          {/* Cover */}
          <div className="w-44 h-44 md:w-36 md:h-36 flex-shrink-0 bg-surface rounded-2xl shadow-2xl flex items-center justify-center overflow-hidden">
            {songs[0]?.thumbnail_url ? (
              <img src={songs[0].thumbnail_url} alt={playlist.name} className="w-full h-full object-cover" />
            ) : (
              <div className="text-textMuted text-4xl font-mono">♫</div>
            )}
          </div>

          <div className="flex-1 min-w-0 pb-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-1.5">
              {playlist.is_public
                ? <Globe size={13} className="text-accent flex-shrink-0" />
                : <Lock size={13} className="text-textMuted flex-shrink-0" />
              }
              <span className="text-[10px] text-textMuted uppercase tracking-[0.2em] font-bold">Playlist</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-text line-clamp-2 leading-tight tracking-tight">{playlist.name}</h1>
            <p className="text-sm text-textMuted mt-3 font-medium">
              <span className="text-textSecondary">{songs.length} songs</span> · {totalDuration(songs)}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-6">
              <button
                onClick={handlePlayAll}
                disabled={songs.length === 0}
                className="flex items-center gap-2 px-7 py-3 bg-accent hover:bg-accentHover text-black font-bold text-sm rounded-full transition-all active:scale-95 disabled:opacity-40"
              >
                <Play size={18} fill="currentColor" />
                Play
              </button>
              <button
                onClick={() => { toggleShuffle(); handlePlayAll(); }}
                disabled={songs.length === 0}
                className={`flex items-center gap-2 px-5 py-3 border text-sm font-bold rounded-full transition-all active:scale-95 disabled:opacity-40 ${
                  shuffle ? 'border-accent text-accent bg-accent/5' : 'border-border text-textSecondary hover:text-text hover:border-text'
                }`}
              >
                <Shuffle size={16} />
                Shuffle
              </button>
              {isOwner && (
                <button
                  onClick={() => setAddSongOpen(true)}
                  className="flex items-center gap-2 px-5 py-3 border border-border text-sm font-bold text-textSecondary hover:text-text hover:border-text rounded-full transition-all active:scale-95"
                >
                  <Plus size={18} />
                  add a song
                </button>
              )}
              {isOwner && (
                <button
                  onClick={() => setEditOpen(true)}
                  className="p-3 border border-border text-textMuted hover:text-text rounded-full transition-colors order-last md:order-none"
                  title="Edit playlist"
                >
                  <Pencil size={16} />
                </button>
              )}
              {playlist.is_public && (
                <button
                  onClick={handleCopyLink}
                  className={`p-3 border rounded-full transition-colors ${
                    copied
                      ? 'border-accent text-accent bg-accent/5'
                      : 'border-border text-textMuted hover:text-text'
                  }`}
                  title="Copy share link"
                >
                  <Link size={16} />
                </button>
              )}
              {isOwner && (
                <button
                  onClick={handleDeletePlaylist}
                  className="p-3 border border-border text-textMuted hover:text-red-400 hover:border-red-400/50 rounded-full transition-colors"
                  title="Delete playlist"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Songs */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {songs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <p className="text-textSecondary text-sm">This playlist is empty</p>
            <p className="text-textMuted text-xs">Add songs from your library using the ⋯ menu</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={songs.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {songs.map((song, i) => (
                <SortableSongRow
                  key={song.id}
                  song={song}
                  index={i}
                  isOwner={isOwner}
                  onRemove={handleRemoveSong}
                  onPlay={(s) => playSong(s, songs)}
                  isCurrentSong={currentSong?.id === song.id}
                  toggleLikeSong={toggleLikeSong}
                  user={user}
                />

              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {editOpen && (
        <PlaylistModal
          playlist={playlist}
          onSubmit={handleEdit}
          onClose={() => setEditOpen(false)}
        />
      )}
      {addSongOpen && (
        <AddSongToPlaylistModal
          existingSongIds={songs.map(s => s.id)}
          onAdd={handleAddSong}
          onClose={() => setAddSongOpen(false)}
        />
      )}
    </div>
  );
}
