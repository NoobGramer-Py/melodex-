import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Loader2, X } from 'lucide-react';
import { searchArtists } from '../../lib/api';
import type { Artist } from '../../types';
import { useLibraryStore } from '../../store/libraryStore';

export function ArtistSearch({ onAdd }: { onAdd: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { addFavoriteArtist } = useLibraryStore();

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { results } = await searchArtists(query);
        setResults(results);
        setIsOpen(true);
      } catch (err) {
        console.error('Artist search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 400);

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

  const handleAdd = (artist: Artist) => {
    addFavoriteArtist(artist);
    setQuery('');
    setIsOpen(false);
    onAdd();
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md animate-in slide-in-from-right-4 duration-300">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted focus-within:text-accent transition-colors" size={16} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search for an artist (Spotify Sync)..."
          className="w-full bg-surface border border-white/10 rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all text-sm"
          autoFocus
        />
        {(query || loading) && (
          <button 
            onClick={() => { setQuery(''); setResults([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-text transition-colors"
          >
            {loading ? <Loader2 size={16} className="animate-spin text-accent" /> : <X size={16} />}
          </button>
        )}
      </div>

      {isOpen && (results.length > 0 || loading) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#181818] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[60] glass animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-1 max-h-[300px] overflow-y-auto custom-scrollbar">
            {!loading && results.length === 0 && query && (
              <div className="p-4 text-center text-textMuted text-xs">No artists found</div>
            )}
            {results.map((artist) => (
              <button
                key={artist.id}
                onClick={() => handleAdd(artist)}
                className="w-full flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-white/5 border border-white/10 group-hover:border-accent/50 transition-colors">
                  {artist.image_url ? (
                    <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-textMuted">?</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-text truncate group-hover:text-accent transition-colors">{artist.name}</h4>
                  <p className="text-[10px] text-textMuted uppercase tracking-tighter">Spotify Artist</p>
                </div>
                <div className="w-6 h-6 rounded-full bg-accent text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                  <Plus size={14} strokeWidth={3} />
                </div>
              </button>
            ))}
          </div>
          <div className="px-3 py-2 bg-white/5 text-[9px] uppercase tracking-widest text-center text-textMuted border-t border-white/5 font-bold">
            Real-time Spotify Catalog Sync
          </div>
        </div>
      )}
    </div>
  );
}
