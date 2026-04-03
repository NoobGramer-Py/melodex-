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
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={16} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for an artist (Spotify sync)..."
          className="w-full bg-surface border border-white/10 rounded-xl pl-10 pr-10 py-2 focus:outline-none focus:border-accent transition-all"
          autoFocus
        />
        {query && (
          <button 
            onClick={() => { setQuery(''); setResults([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-text"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[60]">
          <div className="p-1">
            {results.map((artist) => (
              <button
                key={artist.id}
                onClick={() => handleAdd(artist)}
                className="w-full flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg transition-colors text-left group"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-white/5 border border-white/10">
                  {artist.image_url ? (
                    <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-textMuted">?</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-text truncate group-hover:text-accent">{artist.name}</h4>
                </div>
                <Plus size={16} className="text-textMuted group-hover:text-accent" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
