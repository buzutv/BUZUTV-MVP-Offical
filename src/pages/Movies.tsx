import React, { useCallback, useMemo, useState } from "react";
import ContentCard from "@/components/ContentCard";
import HeroBanner from "@/components/HeroBanner";
import FilterBar from "@/components/FilterBar";
import ContentRow from "@/components/ContentRow";
import ContentGrid from "@/components/ContentGrid";
import ContentModal from "@/components/ContentModal";
import { useAppContent } from "@/hooks/useAppContent";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import { useContent } from "@/hooks/useContent";
import { useChannels } from "@/hooks/useChannels";
import { Spinner } from "@/components/ui/spinner";
import { getOptimizedImageUrl } from "@/utils/youtubeUtils";

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
  const { movieContent, isLoading, continueWatching } = useAppContent();
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
      <div className="min-h-screen text-white">
        <div className="fixed inset-0" style={BACKGROUND_GRADIENT} />
        <div className="relative flex items-center justify-center min-h-screen">
          <Spinner className="w-12 h-12" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0" style={BACKGROUND_GRADIENT} />

      <div className="relative min-h-screen text-white pt-16">
        {movieContent.all.length > 0 ? (
          <>
            {/* --- Hero & Top Ranked Section --- */}
            <div className="max-w-full sm:px-0 md:px-2 pt-4 relative">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:px-0 md:px-4">
                {/* Hero Banner */}
                <div className="lg:col-span-2 relative">
                  <HeroBanner
                    movies={
                      movieContent.all.length > 0
                        ? movieContent.all
                        : movieContent.all.slice(0, 3)
                    }
                  />
                  <div
                    className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
                    style={{ background: "linear-gradient(to bottom right, black 0%, rgba(0,0,0,0.8) 40%, rgba(0,0,0,0.4) 70%, transparent 100%)" }}
                  />
                </div>

                {/* Top Ranked List */}
                <div className="flex flex-col h-full px-4 md:px-0">
                  <h2 className="text-2xl mb-3">Top Ranked Movies</h2>
                  <div className="flex flex-col space-y-3 w-full">
                    {movieContent.topRanked.slice(0, 5).map((movie, index) => (
                      <div
                        key={movie.id}
                        className="relative flex items-center bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-2xl p-2 group border border-white/10 hover:border-brand-500/50 transition-all duration-300 min-h-[85px] h-[calc((60vh-2rem)/5-0.5rem)] cursor-pointer overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(124,58,237,0.15)] hover:-translate-y-0.5 w-full"
                        onClick={() => handleCardClick(movie)}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-brand-500/0 via-brand-500/5 to-brand-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                        {/* Poster Image with Overlaid Number */}
                        <div className="relative w-[30%] h-full flex-shrink-0 mr-4">
                          <div className="absolute -left-1 bottom-0 z-20 pointer-events-none ">
                            <span className="relative bottom-6 -left-2 text-3xl md:text-4xl font-black italic p-2 select-none
                                  text-purple-600
                                  drop-shadow-[0_4px_8px_rgba(255,255,255,0.4)]">
                              {index + 1}
                            </span>
                          </div>
                          <img
                            src={getOptimizedImageUrl(movie.posterUrl, 400)}
                            alt={movie.title}
                            className="w-full h-full object-cover rounded-xl border border-white/10 group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 pr-2">
                          <h3 className="font-bold text-white text-[15px] mb-1 line-clamp-1 group-hover:text-brand-400 transition-colors">{movie.title}</h3>
                          <div className="flex items-center space-x-3 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <span className="text-yellow-500 font-bold">★</span>
                              {movie.rating}
                            </span>
                            <span>•</span>
                            <span className="bg-slate-800/80 px-2 py-0.5 rounded text-[10px] font-bold text-brand-300">
                              {movie.genre?.split(',')[0]}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* --- Content Rows --- */}
            <div className="max-w-full relative pr-6 pl-0 md:pr-8 md:pl-6">
              {activeGenre === "all" ? (
                <>
                  {movieContent.continueWatching?.length > 0 && (
                    <ContentRow
                      title="Continue Watching"
                      items={movieContent.continueWatching}
                      progressBarClassName="bg-brand-500"
                      onCardClick={handleContentRowCardClick}
                    />
                  )}

                  {/* --- Filters Moved below Continue Watching --- */}
                  <div className="mb-8 px-6 pt-4">
                    <FilterBar
                      activeGenre={activeGenre}
                      onGenreChange={handleGenreChange}
                      availableGenres={availableMovieGenres}
                    />
                  </div>

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
                  {/* Filters for specific genre view */}
                  <div className="mb-8 px-6 pt-4">
                    <FilterBar
                      activeGenre={activeGenre}
                      onGenreChange={handleGenreChange}
                      availableGenres={availableMovieGenres}
                    />
                  </div>

                  {getNewestMovies(filteredMovies).length > 0 && (
                    <ContentRow
                      title={`New ${activeGenre.charAt(0).toUpperCase() + activeGenre.slice(1)} Movies`}
                      items={getNewestMovies(filteredMovies)}
                      onCardClick={handleContentRowCardClick}
                    />
                  )}

                  {filteredMovies.length > 2 && (
                    <ContentRow
                      title={`Recommended ${activeGenre.charAt(0).toUpperCase() + activeGenre.slice(1)} Movies`}
                      items={filteredMovies.slice(2, 10)}
                      onCardClick={handleContentRowCardClick}
                    />
                  )}

                  <div className="mt-8 mb-8 pl-4">
                    <h2 className="text-2xl mb-4">All {activeGenre.charAt(0).toUpperCase() + activeGenre.slice(1)} Movies</h2>
                    {filteredMovies.length > 0 ? (
                      <ContentGrid items={filteredMovies} onCardClick={handleContentRowCardClick} />
                    ) : (
                      <div className="text-center py-16 text-gray-400">No Movies Found</div>
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
    </>
  );
});

Movies.displayName = "Movies";
export default Movies;