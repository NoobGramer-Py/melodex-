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
  const [history, setHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('melodex_search_history');
    return saved ? JSON.parse(saved) : [];
  });
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
        const { results } = await searchYouTube(query, 12);
        setResults(results);
        setIsOpen(true);
        setSelectedIndex(-1);
        
        // Update history
        if (query.trim().length > 3) {
          const newHistory = [query, ...history.filter(h => h !== query)].slice(0, 5);
          setHistory(newHistory);
          localStorage.setItem('melodex_search_history', JSON.stringify(newHistory));
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 200); // Super low debounce for live feel

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
          className={`w-full bg-surface/50 backdrop-blur-xl border rounded-full pl-12 pr-12 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all placeholder:text-textMuted/50 shadow-2xl ${
            loading ? 'border-accent/50 animate-pulse' : 'border-white/10'
          }`}
        />
        <div className="absolute right-14 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {loading && <span className="text-[10px] text-accent font-bold uppercase tracking-widest animate-pulse">Syncing...</span>}
            <span className={`w-2 h-2 rounded-full ${loading ? 'bg-accent animate-ping' : 'bg-green-500/50'}`} />
        </div>
        {query && (
          <button 
            onClick={() => { setQuery(''); setResults([]); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-textMuted hover:text-text"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <X size={20} />}
          </button>
        )}
      </div>

      {isOpen && (results.length > 0 || loading || (!query && history.length > 0)) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#121212] border border-white/10 rounded-2xl shadow-2xl overflow-hidden glass z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 max-h-[450px] overflow-y-auto custom-scrollbar">
            {/* History Section */}
            {!query && history.length > 0 && !loading && (
              <div className="mb-2">
                <div className="px-4 py-2 text-[10px] uppercase tracking-widest text-textMuted font-bold flex items-center justify-between">
                  Recent Searches
                  <button onClick={() => { setHistory([]); localStorage.removeItem('melodex_search_history'); }} className="hover:text-accent font-bold">Clear</button>
                </div>
                {history.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => setQuery(h)}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-textMuted hover:text-text text-sm transition-colors"
                  >
                    <Search size={14} className="opacity-50" />
                    {h}
                  </button>
                ))}
                <div className="h-px bg-white/5 my-2 mx-2" />
              </div>
            )}

            {/* Loading / Results */}
            {loading ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-4 p-2 animate-pulse">
                    <div className="w-12 h-12 bg-white/5 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-white/5 rounded w-1/2" />
                      <div className="h-3 bg-white/5 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              results.map((song, index) => (
                <button
                  key={song.youtube_id || song.id}
                  onClick={() => handleSelect(song)}
                  className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all text-left group/item ${
                    selectedIndex === index ? 'bg-white/20 scale-[1.01] shadow-xl' : 'hover:bg-white/10'
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
                    <h4 className={`font-medium truncate transition-colors ${
                      selectedIndex === index ? 'text-accent' : 'text-text'
                    }`}>
                      {song.title}
                    </h4>
                    <p className="text-sm text-textMuted truncate">{song.artist}</p>
                  </div>
                </button>
              ))
            )}
            
            {!loading && query && results.length === 0 && (
              <div className="py-12 text-center text-textMuted">
                <Search className="mx-auto mb-4 opacity-20" size={48} />
                <p>No results found for "{query}"</p>
              </div>
            )}
          </div>
          <div className="bg-white/5 px-4 py-2 text-[10px] uppercase tracking-widest text-textMuted font-bold text-center border-t border-white/5 flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Live Search Optimization Active
          </div>
        </div>
      )}
    </div>
  );
}
