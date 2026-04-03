import { useState, useEffect, useRef } from 'react';
import { Search, Play, X, Loader2 } from 'lucide-react';
import { searchYouTube } from '../../lib/api';
import type { Song } from '../../types';
import { usePlayerStore } from '../../store/playerStore';
import { Thumbnail } from '../shared/Thumbnail';

export function ListenOnlineSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const { playSong } = usePlayerStore();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { results } = await searchYouTube(query, 12); // Increased limit for better breadth
        setResults(results);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (song: Song) => {
    playSong(song);
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(-1);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto mb-8 z-50">
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-textMuted group-focus-within:text-accent transition-colors" size={20} />
        <input
          type="text"
          placeholder="Listen Online: Search any song via YouTube..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim().length > 0 && setIsOpen(true)}
          className="w-full bg-surface/50 backdrop-blur-xl border border-white/10 rounded-full pl-12 pr-12 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all placeholder:text-textMuted/50 shadow-2xl"
        />
        {query && (
          <button 
            onClick={() => { setQuery(''); setResults([]); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-textMuted hover:text-text"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <X size={20} />}
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#121212] border border-white/10 rounded-2xl shadow-2xl overflow-hidden glass z-[60]">
          <div className="p-2">
            {results.map((song, index) => (
              <button
                key={song.youtube_id || song.id}
                onClick={() => handleSelect(song)}
                className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all text-left group/item ${
                  selectedIndex === index ? 'bg-white/20 scale-[1.02] shadow-xl' : 'hover:bg-white/10'
                }`}
              >
                <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden ring-1 ring-white/10">
                  <Thumbnail src={song.thumbnail_url} alt={song.title} className="w-full h-full object-cover" />
                  <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                    selectedIndex === index ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100'
                  }`}>
                    <Play size={16} fill="white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium truncate group-hover/item:text-accent transition-colors ${
                    selectedIndex === index ? 'text-accent' : 'text-text'
                  }`}>
                    {song.title}
                  </h4>
                  <p className="text-sm text-textMuted truncate">{song.artist}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="bg-white/5 px-4 py-2 text-[10px] uppercase tracking-widest text-textMuted font-bold text-center border-t border-white/5">
            Powered by YouTube
          </div>
        </div>
      )}
    </div>
  );
}
