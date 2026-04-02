import { useState, useCallback } from 'react';
import { X, Link, Music, CheckCircle, AlertCircle } from 'lucide-react';
import { AdModal } from '../shared/AdModal';
import { Thumbnail } from '../shared/Thumbnail';
import { useAuthStore } from '../../store/authStore';
import { useLibraryStore } from '../../store/libraryStore';
import { useUIStore } from '../../store/uiStore';
import { usePlayerStore } from '../../store/playerStore';
import { fetchMetadata, startConversionStream } from '../../lib/api';
import type { ConversionMetadata } from '../../types';
import { formatDuration, generateId } from '../../lib/utils';

type Stage =
  | 'idle'
  | 'fetching_meta'
  | 'showing_ad'
  | 'converting'
  | 'uploading'
  | 'saving'
  | 'done'
  | 'error';

export function AddSongModal() {
  const [url, setUrl] = useState('');
  const [stage, setStage] = useState<Stage>('idle');
  const [progress, setProgress] = useState(0);
  const [metadata, setMetadata] = useState<ConversionMetadata | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [cancelStream, setCancelStream] = useState<(() => void) | null>(null);

  const { user } = useAuthStore();
  const { addSong } = useLibraryStore();
  const { closeAddSongModal } = useUIStore();
  const { playSong } = usePlayerStore();

  const reset = useCallback(() => {
    setUrl('');
    setStage('idle');
    setProgress(0);
    setMetadata(null);
    setErrorMessage('');
    cancelStream?.();
    setCancelStream(null);
  }, [cancelStream]);

  const handleClose = () => {
    reset();
    closeAddSongModal();
  };

  // Step 1: Fetch metadata and show ad
  const handleDownloadClick = async () => {
    if (!url.trim()) return;
    setStage('fetching_meta');
    setErrorMessage('');

    try {
      const { metadata: meta } = await fetchMetadata(url.trim());
      setMetadata(meta);
      setStage('showing_ad');
    } catch (err) {
      setStage('error');
      setErrorMessage((err as Error).message || 'Failed to fetch video info');
    }
  };

  // Step 2: Ad completed — start conversion
  const handleAdContinue = async () => {
    setStage('converting');
    setProgress(10);

    try {
      const cancel = await startConversionStream(
        url.trim(),
        metadata,
        (event, data) => {
          if (event === 'status') {
            const { stage: s, progress: p } = data as { stage: string; progress: number };
            setProgress(p);
            if (s === 'uploading') setStage('uploading');
            else if (s === 'saving') setStage('saving');
          } else if (event === 'complete') {
            const { song, audio_url } = data as { song: { title: string; artist: string | null; thumbnail_url: string | null; storage_path: string; duration_seconds: number | null; id: string | null; created_at: string }; audio_url: string };
            const newSong = {
              ...song,
              id: song.id || generateId(),
              audio_url,
            };
            addSong(newSong, !!user);
            // Auto-play the newly downloaded song
            playSong(newSong as Parameters<typeof playSong>[0]);
            setStage('done');
            setProgress(100);
          }
        },
        (message) => {
          setStage('error');
          setErrorMessage(message);
        }
      );
      setCancelStream(() => cancel);
    } catch (err) {
      setStage('error');
      setErrorMessage((err as Error).message || 'Conversion failed');
    }
  };

  const stageLabels: Record<Stage, string> = {
    idle: '',
    fetching_meta: 'Fetching video info…',
    showing_ad: '',
    converting: 'Converting to MP3…',
    uploading: 'Uploading audio…',
    saving: 'Saving to library…',
    done: 'Added to library!',
    error: 'Something went wrong',
  };

  const isProcessing = ['fetching_meta', 'converting', 'uploading', 'saving'].includes(stage);

  return (
    <>
      {/* Ad modal overlay */}
      {stage === 'showing_ad' && (
        <AdModal
          onContinue={handleAdContinue}
          onClose={() => setStage('idle')}
          songTitle={metadata?.title}
        />
      )}

      {/* Main modal */}
      <div className="fixed inset-0 z-40 flex items-center justify-center animate-fade-in">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={!isProcessing ? handleClose : undefined} />

        <div className="relative z-10 w-full max-w-md mx-4 bg-[#111111] border border-border rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Music size={16} className="text-accent" />
                </div>
                <h2 className="text-base font-semibold text-text">Add from YouTube</h2>
              </div>
              {!isProcessing && (
                <button onClick={handleClose} className="text-textMuted hover:text-text transition-colors p-1.5 rounded-lg hover:bg-surface">
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Metadata preview */}
            {metadata && stage !== 'idle' && (
              <div className="flex items-center gap-3 p-3 bg-surface rounded-xl mb-5">
                <Thumbnail src={metadata.thumbnail_url} alt={metadata.title} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text line-clamp-1">{metadata.title}</p>
                  <p className="text-xs text-textMuted mt-0.5">
                    {metadata.artist} · {formatDuration(metadata.duration_seconds)}
                  </p>
                </div>
              </div>
            )}

            {/* URL input */}
            {stage === 'idle' || stage === 'error' ? (
              <div className="space-y-4">
                <div className="relative">
                  <Link size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
                  <input
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleDownloadClick()}
                    className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-text placeholder-textMuted focus:outline-none focus:border-accent transition-colors"
                    autoFocus
                  />
                </div>

                {errorMessage && (
                  <div className="flex items-start gap-2 text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2.5">
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    {errorMessage}
                  </div>
                )}

                <button
                  onClick={handleDownloadClick}
                  disabled={!url.trim()}
                  className="w-full bg-accent hover:bg-accentHover text-black font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Download Song
                </button>

                <p className="text-center text-xs text-textMuted">
                  A short ad will play before conversion begins
                </p>
              </div>
            ) : stage === 'done' ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <CheckCircle size={40} className="text-accent" />
                <p className="text-sm font-medium text-text">Song added to your library!</p>
                <button
                  onClick={handleClose}
                  className="px-6 py-2.5 bg-accent hover:bg-accentHover text-black font-semibold rounded-full text-sm transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              // Processing state
              <div className="space-y-4 py-2">
                <p className="text-sm text-textSecondary text-center">{stageLabels[stage]}</p>

                <div className="space-y-2">
                  <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-right text-xs text-textMuted font-mono tabular-nums">
                    {Math.round(progress)}%
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
