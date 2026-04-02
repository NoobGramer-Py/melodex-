import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Mic2,
} from 'lucide-react';
import { usePlayerStore } from '../../store/playerStore';
import { useUIStore } from '../../store/uiStore';
import { Thumbnail } from '../shared/Thumbnail';
import { formatDuration } from '../../lib/utils';

export function PlayerBar() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    shuffle,
    repeat,
    isLoadingAudio,
    togglePlay,
    playNext,
    playPrev,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
  } = usePlayerStore();

  const { toggleLyrics, lyricsOpen } = useUIStore();

  if (!currentSong) {
    return (
      <div className="h-20 border-t border-border bg-[#0d0d0d] flex items-center justify-center">
        <p className="text-xs text-textMuted">
          Paste a YouTube link to start listening
        </p>
      </div>
    );
  }

  const seekProgress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const RepeatIcon = repeat === 'one' ? Repeat1 : Repeat;

  return (
    <div className="h-20 border-t border-border bg-[#0d0d0d] flex items-center px-4 gap-4">
      {/* Song info */}
      <div className="flex items-center gap-3 w-56 min-w-0 flex-shrink-0">
        <Thumbnail src={currentSong.thumbnail_url} alt={currentSong.title} size="sm" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-text line-clamp-1">{currentSong.title}</p>
          <p className="text-xs text-textMuted line-clamp-1">{currentSong.artist || 'Unknown'}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex-1 flex flex-col items-center gap-2">
        <div className="flex items-center gap-5">
          <button
            onClick={toggleShuffle}
            className={`transition-colors ${shuffle ? 'text-accent' : 'text-textMuted hover:text-text'}`}
            title="Shuffle"
          >
            <Shuffle size={16} />
          </button>

          <button
            onClick={playPrev}
            className="text-textSecondary hover:text-text transition-colors"
            title="Previous"
          >
            <SkipBack size={20} />
          </button>

          <button
            onClick={togglePlay}
            disabled={isLoadingAudio}
            className="w-9 h-9 bg-text rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform disabled:opacity-50"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoadingAudio ? (
              <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" className="ml-0.5" />
            )}
          </button>

          <button
            onClick={playNext}
            className="text-textSecondary hover:text-text transition-colors"
            title="Next"
          >
            <SkipForward size={20} />
          </button>

          <button
            onClick={cycleRepeat}
            className={`transition-colors ${repeat !== 'off' ? 'text-accent' : 'text-textMuted hover:text-text'}`}
            title={`Repeat: ${repeat}`}
          >
            <RepeatIcon size={16} />
          </button>
        </div>

        {/* Seek bar */}
        <div className="w-full max-w-md flex items-center gap-2">
          <span className="text-xs text-textMuted font-mono tabular-nums w-8 text-right">
            {formatDuration(currentTime)}
          </span>
          <div className="flex-1 relative group">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={e => seek(parseFloat(e.target.value))}
              className="w-full h-1 cursor-pointer"
              style={{
                background: `linear-gradient(to right, #1DB954 ${seekProgress}%, #2a2a2a ${seekProgress}%)`,
              }}
            />
          </div>
          <span className="text-xs text-textMuted font-mono tabular-nums w-8">
            {formatDuration(duration)}
          </span>
        </div>
      </div>

      {/* Volume + Lyrics */}
      <div className="flex items-center gap-3 w-44 justify-end flex-shrink-0">
        <button
          onClick={toggleLyrics}
          className={`transition-colors ${lyricsOpen ? 'text-accent' : 'text-textMuted hover:text-text'}`}
          title="Lyrics"
        >
          <Mic2 size={18} />
        </button>

        <button onClick={toggleMute} className="text-textMuted hover:text-text transition-colors">
          {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>

        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={isMuted ? 0 : volume}
          onChange={e => setVolume(parseFloat(e.target.value))}
          className="w-20 h-1 cursor-pointer"
          style={{
            background: `linear-gradient(to right, #ffffff ${(isMuted ? 0 : volume) * 100}%, #2a2a2a ${(isMuted ? 0 : volume) * 100}%)`,
          }}
        />
      </div>
    </div>
  );
}
