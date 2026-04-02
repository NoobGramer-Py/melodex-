import { useState, useEffect } from 'react';
import { X, Globe, Lock } from 'lucide-react';
import type { Playlist } from '../../types';

interface PlaylistModalProps {
  playlist?: Playlist | null;
  onSubmit: (name: string, isPublic: boolean) => Promise<void>;
  onClose: () => void;
}

export function PlaylistModal({ playlist, onSubmit, onClose }: PlaylistModalProps) {
  const [name, setName] = useState(playlist?.name || '');
  const [isPublic, setIsPublic] = useState(playlist?.is_public || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (playlist) {
      setName(playlist.name);
      setIsPublic(playlist.is_public);
    }
  }, [playlist]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    setLoading(true);
    setError('');
    try {
      await onSubmit(name.trim(), isPublic);
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to save playlist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm mx-4 bg-[#111111] border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-text">
              {playlist ? 'Edit playlist' : 'New playlist'}
            </h2>
            <button onClick={onClose} className="text-textMuted hover:text-text transition-colors p-1 rounded-lg hover:bg-surface">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-textMuted uppercase tracking-wider mb-1.5 block">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="My playlist"
                maxLength={100}
                autoFocus
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-textMuted focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-textMuted uppercase tracking-wider mb-2 block">
                Visibility
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border transition-colors ${
                    !isPublic
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border bg-surface text-textSecondary hover:bg-surfaceHover'
                  }`}
                >
                  <Lock size={14} />
                  Private
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border transition-colors ${
                    isPublic
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border bg-surface text-textSecondary hover:bg-surfaceHover'
                  }`}
                >
                  <Globe size={14} />
                  Public
                </button>
              </div>
              {isPublic && (
                <p className="text-xs text-textMuted mt-2">
                  Anyone with the link can view and play this playlist.
                </p>
              )}
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full bg-accent hover:bg-accentHover text-black font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving…' : playlist ? 'Save changes' : 'Create playlist'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
