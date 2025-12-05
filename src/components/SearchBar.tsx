import { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onResultSelect?: (result: any) => void;
  results?: any[];
  placeholder?: string;
  isLoading?: boolean;
  renderResult?: (result: any, onSelect: () => void) => React.ReactNode;
  showResults?: boolean;
  className?: string;
  setMovies: (movies: any) => void;
  setActualVideoUrl: (videoUrl: string) => void;
  setVideoEnded: (videoEnded: boolean) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  currentMovieIdRef: React.MutableRefObject<string | null>;
  moviesRef: React.MutableRefObject<any[]>;
}

const SearchBar = ({
  onSearch,
  onResultSelect,
  results = [],
  placeholder = "Search...",
  isLoading = false,
  renderResult,
  showResults = true,
  className = "",
  setMovies,
  setActualVideoUrl,
  setVideoEnded,
  currentMovieIdRef,
  moviesRef,
  setIsPlaying }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  const handleResultClick = (result: any) => {
    console.log("Search Result", result);

    onResultSelect?.(result);
    setIsFocused(false);
  };

  const showDropdown = isFocused && query.trim().length > 0 && showResults;

  return (
    <div className={`relative w-full ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:border-white/40 focus:bg-white/15 transition"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/20 rounded-lg shadow-2xl max-h-96 overflow-y-auto z-50">
          {isLoading ? (
            <div className="p-4 text-center text-white/60">
              <div className="animate-spin w-6 h-6 border-2 border-white/20 border-t-white rounded-full mx-auto"></div>
              <p className="mt-2 text-sm">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => {
                // if (renderResult) {
                //   return renderResult(result, () => handleResultClick(result));
                // }
                // Default result renderer
                return (
                  <div
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className="px-4 py-3 hover:bg-white/10 cursor-pointer transition border-b border-white/5 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      {result.poster_url && (
                        <img
                          src={result.poster_url}
                          alt={result.title || result.content_title}
                          className="w-12 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-white">
                          {result.title || result.content_title}
                        </p>
                        <p className="text-xs text-white/60 mt-1">
                          {result.year && `${result.year} • `}
                          {result.type && (
                            <span className="capitalize">{result.type}</span>
                          )}
                          {result.genre && ` • ${result.genre}`}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center text-white/60">
              <p className="text-sm">No results found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;