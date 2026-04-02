import { useEffect, useRef, useState } from 'react';
import { X, Music } from 'lucide-react';
import { usePlayerStore } from '../../store/playerStore';
import { useUIStore } from '../../store/uiStore';

interface LyricsState {
  lyrics: string | null;
  loading: boolean;
  error: string | null;
}

async function fetchLyrics(artist: string, title: string): Promise<string> {
  // Clean up title: remove "(Official Video)", "[Lyrics]" etc.
  const cleanTitle = title
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/official|lyrics|video|audio|hd|hq/gi, '')
    .trim();

  const encodedArtist = encodeURIComponent(artist.trim());
  const encodedTitle = encodeURIComponent(cleanTitle);

  const response = await fetch(
    `https://api.lyrics.ovh/v1/${encodedArtist}/${encodedTitle}`
  );

  if (!response.ok) {
    throw new Error('Lyrics not found');
  }

  const data = await response.json();
  if (!data.lyrics || data.lyrics.trim().length === 0) {
    throw new Error('Lyrics unavailable');
  }

  return data.lyrics;
}

export function LyricsPanel() {
  const { currentSong } = usePlayerStore();
  const { lyricsOpen, setLyricsOpen } = useUIStore();
  const [state, setState] = useState<LyricsState>({ lyrics: null, loading: false, error: null });
  const lastFetchedKey = useRef<string>('');

  useEffect(() => {
    if (!lyricsOpen || !currentSong) return;

    const key = `${currentSong.artist}-${currentSong.title}`;
    if (key === lastFetchedKey.current) return;

    lastFetchedKey.current = key;

    if (!currentSong.artist) {
      setState({ lyrics: null, loading: false, error: 'No artist info to search lyrics' });
      return;
    }

    setState({ lyrics: null, loading: true, error: null });

    fetchLyrics(currentSong.artist, currentSong.title)
      .then(lyrics => setState({ lyrics, loading: false, error: null }))
      .catch(err => setState({ lyrics: null, loading: false, error: err.message }));
  }, [lyricsOpen, currentSong]);

  if (!lyricsOpen) return null;

  return (
    <div className="w-72 flex-shrink-0 border-l border-border bg-[#0d0d0d] flex flex-col animate-slide-in-right overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Music size={16} className="text-accent" />
          <span className="text-sm font-medium text-text">Lyrics</span>
        </div>
        <button
          onClick={() => setLyricsOpen(false)}
          className="text-textMuted hover:text-text transition-colors p-1 rounded-lg hover:bg-surface"
        >
          <X size={16} />
        </button>
      </div>

      {/* Song info */}
      {currentSong && (
        <div className="px-5 py-3 border-b border-border">
          <p className="text-sm font-medium text-text line-clamp-1">{currentSong.title}</p>
          <p className="text-xs text-textMuted mt-0.5">{currentSong.artist || 'Unknown'}</p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {!currentSong ? (
          <p className="text-sm text-textMuted text-center mt-8">
            Play a song to see lyrics
          </p>
        ) : state.loading ? (
          <div className="space-y-2 mt-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-4 bg-surface rounded animate-skeleton-pulse"
                style={{ width: `${60 + Math.random() * 35}%`, animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        ) : state.error ? (
          <div className="mt-8 text-center">
            <p className="text-sm text-textMuted">{state.error}</p>
            <p className="text-xs text-textMuted/60 mt-2">
              Try searching manually on Genius or AZLyrics
            </p>
          </div>
        ) : state.lyrics ? (
          <pre className="text-sm text-textSecondary leading-relaxed whitespace-pre-wrap font-sans">
            {state.lyrics}
          </pre>
        ) : null}
      </div>
    </div>
  );
}
