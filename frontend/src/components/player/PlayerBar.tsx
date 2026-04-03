import { useState, useRef, useEffect } from 'react';
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
  MoreVertical,
  Download,
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
  const [showOptions, setShowOptions] = useState(false);

  const { toggleLyrics, lyricsOpen, openAddSongModal } = useUIStore();

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
    <div className="h-20 border-t border-border bg-[#0d0d0d] flex items-center px-4 gap-4 relative z-50">
      {/* Song info */}
      <div className="flex items-center gap-3 w-56 min-w-0 flex-shrink-0 md:flex-initial">
        <Thumbnail src={currentSong.thumbnail_url} alt={currentSong.title} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text line-clamp-1">{currentSong.title}</p>
          <p className="text-xs text-textMuted line-clamp-1">{currentSong.artist || 'Unknown'}</p>
        </div>

        <div className="relative">
          <button 
            onClick={() => setShowOptions(!showOptions)}
            className="p-1 text-textMuted hover:text-text transition-colors"
          >
            <MoreVertical size={18} />
          </button>

          {showOptions && (
            <div className="absolute bottom-full left-0 mb-2 w-48 bg-surface border border-border rounded-xl shadow-2xl py-1 z-[70] animate-in fade-in slide-in-from-bottom-2 duration-200">
              <button 
                onClick={() => {
                  setShowOptions(false);
                  openAddSongModal(
                    currentSong.youtube_id ? `https://youtube.com/watch?v=${currentSong.youtube_id}` : '',
                    {
                      title: currentSong.title,
                      artist: currentSong.artist || 'Unknown',
                      thumbnail_url: currentSong.thumbnail_url,
                      duration_seconds: currentSong.duration_seconds || 0,
                      youtube_id: currentSong.youtube_id || ''
                    }
                  );
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text hover:bg-white/10 transition-colors"
              >
                <Download size={16} className="text-accent" />
                Download Song
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
        <div className="flex items-center gap-4 md:gap-7">
          <button
            onClick={toggleShuffle}
            className={`hidden sm:block transition-colors ${shuffle ? 'text-accent' : 'text-textMuted hover:text-text'}`}
            title="Shuffle"
          >
            <Shuffle size={14} />
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
            className="w-10 h-10 bg-text rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform disabled:opacity-50 flex-shrink-0"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoadingAudio ? (
              <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause size={20} fill="currentColor" />
            ) : (
              <Play size={20} fill="currentColor" className="ml-0.5" />
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
            className={`hidden sm:block transition-colors ${repeat !== 'off' ? 'text-accent' : 'text-textMuted hover:text-text'}`}
            title={`Repeat: ${repeat}`}
          >
            <RepeatIcon size={14} />
          </button>
        </div>

        {/* Seek bar */}
        <div className="w-full max-w-md flex items-center gap-2">
          <span className="hidden sm:block text-[10px] text-textMuted font-mono tabular-nums w-8 text-right">
            {formatDuration(currentTime)}
          </span>
          <div className="flex-1 relative group py-2">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={e => seek(parseFloat(e.target.value))}
              className="w-full h-1 cursor-pointer absolute top-1/2 -translate-y-1/2 opacity-100 accent-accent"
              style={{
                background: `linear-gradient(to right, #1DB954 ${seekProgress}%, #2a2a2a ${seekProgress}%)`,
              }}
            />
          </div>
          <span className="hidden sm:block text-[10px] text-textMuted font-mono tabular-nums w-8">
            {formatDuration(duration)}
          </span>
        </div>
      </div>

      {/* Volume + Lyrics (Desktop only) */}
      <div className="hidden md:flex items-center gap-3 w-44 justify-end flex-shrink-0">
        <button
          onClick={toggleLyrics}
          className={`p-1.5 transition-colors ${lyricsOpen ? 'text-accent' : 'text-textMuted hover:text-text'}`}
          title="Lyrics"
        >
          <Mic2 size={18} />
        </button>

        <button onClick={toggleMute} className="p-1.5 text-textMuted hover:text-text transition-colors">
          {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>

        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={isMuted ? 0 : volume}
          onChange={e => setVolume(parseFloat(e.target.value))}
          className="w-20 h-1 cursor-pointer accent-white"
          style={{
            background: `linear-gradient(to right, #ffffff ${(isMuted ? 0 : volume) * 100}%, #2a2a2a ${(isMuted ? 0 : volume) * 100}%)`,
          }}
        />
      </div>
    </div>
  );
}
