import { Globe, Lock, Music, MoreHorizontal, Pencil, Trash2, Link } from 'lucide-react';
import type { Playlist } from '../../types';

interface PlaylistCardProps {
  playlist: Playlist;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopyLink?: () => void;
}

export function PlaylistCard({ playlist, onClick, onEdit, onDelete, onCopyLink }: PlaylistCardProps) {
  return (
    <div
      className="group bg-surface hover:bg-surfaceHover rounded-xl p-4 cursor-pointer transition-colors"
      onClick={onClick}
    >
      {/* Cover */}
      <div className="w-full aspect-square bg-[#1a1a1a] rounded-lg mb-3 flex items-center justify-center overflow-hidden">
        {playlist.cover_thumbnail ? (
          <img
            src={playlist.cover_thumbnail}
            alt={playlist.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Music size={32} className="text-textMuted" />
        )}
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text line-clamp-1">{playlist.name}</p>
          <div className="flex items-center gap-1.5 mt-1">
            {playlist.is_public ? (
              <Globe size={11} className="text-accent flex-shrink-0" />
            ) : (
              <Lock size={11} className="text-textMuted flex-shrink-0" />
            )}
            <p className="text-xs text-textMuted">
              {playlist.song_count ?? 0} songs
            </p>
          </div>
        </div>

        {/* Actions */}
        <div
          className="opacity-0 group-hover:opacity-100 transition-opacity relative"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="p-1.5 text-textMuted hover:text-text rounded-lg hover:bg-border transition-colors"
              title="Edit playlist"
            >
              <Pencil size={13} />
            </button>
            {playlist.is_public && onCopyLink && (
              <button
                onClick={onCopyLink}
                className="p-1.5 text-textMuted hover:text-accent rounded-lg hover:bg-border transition-colors"
                title="Copy share link"
              >
                <Link size={13} />
              </button>
            )}
            <button
              onClick={onDelete}
              className="p-1.5 text-textMuted hover:text-red-400 rounded-lg hover:bg-border transition-colors"
              title="Delete playlist"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
