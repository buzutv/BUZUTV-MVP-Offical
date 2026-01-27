import React, { useCallback, useMemo, useState } from "react";
import ContentCard from "@/components/ContentCard";
import HeroBanner from "@/components/HeroBanner";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import FilterBar from "@/components/FilterBar";
import ContentRow from "@/components/ContentRow";
import ContentGrid from "@/components/ContentGrid";
import ContentModal from "@/components/ContentModal";
import { useAppContent } from "@/hooks/useAppContent";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import { useContent } from "@/hooks/useContent";
import { useChannels } from "@/hooks/useChannels";
import { Spinner } from "@/components/ui/spinner";

// Background style constant to keep JSX clean
const BACKGROUND_GRADIENT = {
  background: `linear-gradient(200deg, #311066 0%, #1D0833 20%, #120222 45%, black 100%)`,
};

// Define the order of genres to display
const GENRE_ORDER = [
  "Comedy", "Drama", "Sports", "Romance",
  "Action", "Lifestyle", "Documentary", "Informational"
];

const Movies = React.memo(() => {
  const { movieContent, isLoading } = useAppContent();
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [activeGenre, setActiveGenre] = useState("all");

  const { favoriteIds, addToFavorites, removeFromFavorites } = useUserFavorites();
  const { content: rawContent } = useContent();
  const { channels } = useChannels();

  // 1. Memoized Genres
  const availableMovieGenres = useMemo(() => {
    if (!movieContent.all?.length) return ["All"];
    const movieGenres = [...new Set(movieContent.all.map((m) => m.genre).filter(Boolean))];
    return ["All", ...movieGenres.sort()];
  }, [movieContent.all]);

  // 2. Memoized Filtered Movies
  const filteredMovies = useMemo(() => {
    if (activeGenre === "all") return movieContent.all;
    return movieContent.all.filter(
      (movie) => movie.genre.toLowerCase() === activeGenre.toLowerCase()
    );
  }, [movieContent.all, activeGenre]);

  // 3. Helper: Sort by Date
  const getNewestMovies = (list, limit = 8) => {
    return list
      .filter((m) => m.created_at)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  };

  const handleGenreChange = useCallback((genre: string) => setActiveGenre(genre), []);
  const handleCardClick = useCallback((movie) => setSelectedMovie(movie), []);

  /* --- Modal Actions --- */
  const handlePlayEpisode = useCallback(
    (videoUrl: string, title: string) => {
      // FullscreenPlayer is now triggered by Redux or internal modal state
    },
    []
  );

  const handleContentRowCardClick = useCallback((movie?: any) => {
    if (movie) setSelectedMovie(movie);
    return true;
  }, []);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen text-white">
          <div className="fixed inset-0" style={BACKGROUND_GRADIENT} />
          <div className="relative flex items-center justify-center min-h-screen">
            <Spinner className="w-12 h-12" />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="fixed inset-0" style={BACKGROUND_GRADIENT} />

      <div className="relative min-h-screen text-white pt-16">
        {movieContent.all.length > 0 ? (
          <>
            {/* --- Hero & Top Ranked Section --- */}
            <div className="max-w-full relative pt-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:px-4">
                {/* Hero Banner */}
                <div className="lg:col-span-2 relative">
                  <HeroBanner movies={movieContent.featured} />
                  <div
                    className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
                    style={{ background: "linear-gradient(to bottom right, black 0%, rgba(0,0,0,0.8) 40%, rgba(0,0,0,0.4) 70%, transparent 100%)" }}
                  />
                </div>

                {/* Top Ranked List */}
                <div className="flex flex-col h-full px-4 md:px-0">
                  <h2 className="text-2xl font-bold mb-3">Top Ranked Movies</h2>
                  <div className="flex flex-col space-y-3 w-full overflow-y-auto" style={{ height: "calc(60vh - 2rem)" }}>
                    {movieContent.topRanked.slice(0, 5).map((movie, index) => (
                      <div
                        key={movie.id}
                        className="relative flex items-center bg-black/40 backdrop-blur-md rounded-lg p-2 border-2 border-white/10 hover:border-brand-500/50 cursor-pointer transition-all duration-300"
                        onClick={() => handleCardClick(movie)}
                      >
                        {/* Rank Badge */}
                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 z-10">
                          <span className="bg-[#131313] text-brand-200 font-bold px-3 py-1 rounded-full border border-brand-500/50 shadow-lg text-sm">
                            #{index + 1}
                          </span>
                        </div>
                        {/* Movie Info (Simplified for brevity) */}
                        <img
                          src={movie.posterUrl}
                          alt={movie.title}
                          className="w-16 h-20 object-cover rounded-lg ml-6 mr-3"
                        />
                        <div>
                          <h3 className="font-semibold line-clamp-1">{movie.title}</h3>
                          <p className="text-xs text-gray-300">{movie.year} • ★ {movie.rating}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* --- Filters --- */}
            <div className="mb-4 px-6 pt-8">
              <FilterBar
                activeGenre={activeGenre}
                onGenreChange={handleGenreChange}
                availableGenres={availableMovieGenres}
              />
            </div>

            {/* --- Content Rows --- */}
            <div className="max-w-full relative pr-6 pl-0 md:pr-8 md:pl-6">
              {activeGenre === "all" ? (
                <>
                  {/* Continue Watching Row */}
                  {movieContent.continueWatching?.length > 0 && (
                    <ContentRow
                      title="Continue Watching"
                      items={movieContent.continueWatching}
                      onCardClick={handleContentRowCardClick}
                    />
                  )}

                  {/* New Movies Row */}
                  {getNewestMovies(movieContent.all).length > 0 && (
                    <ContentRow
                      title="New Movies"
                      items={getNewestMovies(movieContent.all)}
                      onCardClick={handleContentRowCardClick}
                    />
                  )}

                  {/* Recommended Row */}
                  {movieContent.recommended.length > 0 && (
                    <ContentRow
                      title="Recommended"
                      items={movieContent.recommended.slice(0, 8)}
                      onCardClick={handleContentRowCardClick}
                    />
                  )}

                  {/* Mapped Genre Rows (DRY implementation) */}
                  {GENRE_ORDER.map(genre => {
                    const genreItems = movieContent.byGenre[genre];
                    if (!genreItems || genreItems.length === 0) return null;
                    return (
                      <ContentRow
                        key={genre}
                        title={genre}
                        items={genreItems.slice(0, 8)}
                        onCardClick={handleContentRowCardClick}
                      />
                    );
                  })}
                </>
              ) : (
                /* Filtered View */
                <>
                  {getNewestMovies(filteredMovies).length > 0 && (
                    <ContentRow
                      title={`New ${activeGenre} Movies`}
                      items={getNewestMovies(filteredMovies)}
                      onCardClick={handleContentRowCardClick}
                    />
                  )}

                  {filteredMovies.length > 2 && (
                    <ContentRow
                      title={`Recommended ${activeGenre} Movies`}
                      items={filteredMovies.slice(2, 10)}
                      onCardClick={handleContentRowCardClick}
                    />
                  )}

                  <div className="mt-8 mb-8 pl-4">
                    <h2 className="text-2xl mb-4">All {activeGenre} Movies</h2>
                    {filteredMovies.length > 0 ? (
                      <ContentGrid items={filteredMovies} onCardClick={handleContentRowCardClick} />
                    ) : (
                      <div className="text-center py-16 text-gray-400">No movies found</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <h2 className="text-2xl mb-4">No movies available</h2>
          </div>
        )}

        {/* --- Modal --- */}
        {selectedMovie && (
          <ContentModal
            isOpen={!!selectedMovie}
            onClose={() => setSelectedMovie(null)}
            item={selectedMovie}
            variant="movie"
            autoDetectKids={true}
            onPlayEpisode={handlePlayEpisode}
            movieId={selectedMovie.id}
            videoUrl={rawContent.find(i => i.id === selectedMovie.id)?.video_url}
            channel={channels.find(c => c.id === selectedMovie.channelId)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
});

Movies.displayName = "Movies";
export default Movies;