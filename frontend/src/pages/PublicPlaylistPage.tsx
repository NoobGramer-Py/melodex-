import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, Music2, Globe, ExternalLink } from 'lucide-react';
import { fetchPlaylist } from '../lib/api';
import { usePlayerStore } from '../store/playerStore';
import { Thumbnail } from '../components/shared/Thumbnail';
import { formatDuration, totalDuration } from '../lib/utils';
import type { Playlist, Song } from '../types';

export default function PublicPlaylistPage() {
  const { id } = useParams<{ id: string }>();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { playSong, currentSong, isPlaying, togglePlay } = usePlayerStore();

  useEffect(() => {
    if (!id) return;
    fetchPlaylist(id)
      .then(data => {
        setPlaylist(data.playlist);
        setSongs(data.songs);
      })
      .catch(err => setError(err.message || 'Playlist not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePlayAll = () => {
    if (songs.length > 0) playSong(songs[0], songs);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-textMuted text-sm">Loading playlist…</p>
        </div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-textSecondary">{error || 'Playlist not found'}</p>
        <Link
          to="/"
          className="px-5 py-2.5 bg-accent hover:bg-accentHover text-black text-sm font-medium rounded-full transition-colors"
        >
          Go to Melodex
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center">
            <Music2 size={15} className="text-black" />
          </div>
          <span className="font-semibold text-sm text-text">Melodex</span>
        </Link>
        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm text-textMuted hover:text-text transition-colors"
        >
          <ExternalLink size={14} />
          Open app
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Playlist header */}
        <div className="flex items-end gap-6 mb-8">
          <div className="w-40 h-40 flex-shrink-0 bg-surface rounded-xl overflow-hidden flex items-center justify-center">
            {songs[0]?.thumbnail_url ? (
              <img src={songs[0].thumbnail_url} alt={playlist.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl text-textMuted">♫</span>
            )}
          </div>

          <div className="flex-1 pb-1">
            <div className="flex items-center gap-1.5 mb-1">
              <Globe size={12} className="text-accent" />
              <span className="text-xs text-textMuted uppercase tracking-widest">Public playlist</span>
            </div>
            <h1 className="text-3xl font-bold text-text">{playlist.name}</h1>
            <p className="text-sm text-textMuted mt-2">
              {songs.length} songs · {totalDuration(songs)}
            </p>
            <button
              onClick={handlePlayAll}
              disabled={songs.length === 0}
              className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accentHover text-black font-semibold text-sm rounded-full transition-colors disabled:opacity-40"
            >
              <Play size={16} fill="currentColor" />
              Play all
            </button>
          </div>
        </div>

        {/* Song list */}
        <div className="space-y-0.5">
          {songs.map((song, i) => {
            const isActive = currentSong?.id === song.id;
            return (
              <div
                key={song.id}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                  isActive ? 'bg-surfaceHover' : 'hover:bg-surface'
                }`}
                onClick={() => isActive ? togglePlay() : playSong(song, songs)}
              >
                <span className="text-xs text-textMuted font-mono w-5 text-right">{i + 1}</span>
                <Thumbnail src={song.thumbnail_url} alt={song.title} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium line-clamp-1 ${isActive ? 'text-accent' : 'text-text'}`}>
                    {song.title}
                  </p>
                  <p className="text-xs text-textMuted mt-0.5">{song.artist || 'Unknown'}</p>
                </div>
                <span className="text-xs text-textMuted font-mono tabular-nums">
                  {formatDuration(song.duration_seconds)}
                </span>
              </div>
            );
          })}
        </div>
      </main>

      {/* Embedded player — only shows when something is playing */}
      {currentSong && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-[#0d0d0d]/95 backdrop-blur-md px-6 py-3 flex items-center gap-4">
          <Thumbnail src={currentSong.thumbnail_url} alt={currentSong.title} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text line-clamp-1">{currentSong.title}</p>
            <p className="text-xs text-textMuted">{currentSong.artist}</p>
          </div>
          <button
            onClick={togglePlay}
            className="w-9 h-9 bg-text rounded-full flex items-center justify-center text-black"
          >
            {isPlaying ? (
              <span className="flex gap-0.5">
                <span className="w-1 h-4 bg-black rounded-sm" />
                <span className="w-1 h-4 bg-black rounded-sm" />
              </span>
            ) : (
              <Play size={16} fill="currentColor" className="ml-0.5" />
            )}
          </button>
          <Link
            to="/"
            className="text-xs text-accent hover:text-accentHover transition-colors whitespace-nowrap"
          >
            Open in app →
          </Link>
        </div>
      )}
    </div>
  );
}
