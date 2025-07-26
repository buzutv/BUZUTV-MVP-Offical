import React, { useState } from "react";
import OptimizedMovieCard from "@/components/OptimizedMovieCard";
import MovieHoverRow from "@/components/MovieHoverRow";
import HeroBanner from "@/components/HeroBanner";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import FilterBar from "@/components/FilterBar";
import HomeRow from "@/components/HomeRow";
import ContentGrid from "@/components/ContentGrid";
import { useAppContent } from "@/hooks/useAppContent";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import MovieModal from "@/components/MovieModal";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import { useContent } from "@/hooks/useContent";
import { useChannels } from "@/hooks/useChannels";
import FullscreenPlayer from "@/components/FullscreenPlayer";

const Movies = () => {
  const { movieContent, isLoading, content } = useAppContent();
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [activeGenre, setActiveGenre] = useState("all");

  // Debug log for Movies page content
  console.log("🎬 [Movies] Page content loaded:", {
    isLoading,
    totalMovies: movieContent.all.length,
    featuredMovies: movieContent.featured.length,
    trendingMovies: movieContent.trending.length,
    topRankedMovies: movieContent.topRanked.length,
    recommendedMovies: movieContent.recommended.length,
    newMovies: movieContent.new.length,
    genreBreakdown: Object.entries(movieContent.byGenre)
      .map(([genre, movies]) => ({
        genre,
        count: movies.length,
        titles: movies.slice(0, 3).map((m) => m.title),
      }))
      .filter((g) => g.count > 0),
    sampleMovieTitles: movieContent.all.slice(0, 5).map((m) => m.title),
  });
  const { favoriteIds, addToFavorites, removeFromFavorites } =
    useUserFavorites();
  const { content: rawContent } = useContent();
  const { channels } = useChannels();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Get genres that actually have movie content (excluding kids)
  const availableMovieGenres = React.useMemo(() => {
    if (!movieContent.all || movieContent.all.length === 0) {
      return ["All"];
    }

    const movieGenres = [
      ...new Set(movieContent.all.map((movie) => movie.genre).filter(Boolean)),
    ];

    return ["All", ...movieGenres.sort()];
  }, [movieContent.all]);

  const handleGenreChange = (genre: string) => {
    setActiveGenre(genre);
  };

  // Get filtered movies based on active genre
  const getFilteredMovies = () => {
    if (activeGenre === "all") {
      return movieContent.all;
    }
    return movieContent.all.filter(
      (movie) => movie.genre.toLowerCase() === activeGenre.toLowerCase(),
    );
  };

  const filteredMovies = getFilteredMovies();

  const handleHomeRowCardClick = () => {
    return false; // Movies page doesn't need login modal for card clicks
  };

  // Add click logic for Top Ranked
  const handleCardClick = (movie) => {
    setSelectedMovie(movie);
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <div className="text-2xl">Loading...</div>
        </div>
      </ProtectedRoute>
    );
  }

  const MovieRow = ({
    title,
    movies,
  }: {
    title: string;
    movies: typeof movieContent.all;
  }) => (
    <section className="mb-8 px-4">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <Carousel
        opts={{
          align: "start",
          skipSnaps: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-1">
          <MovieHoverRow className="flex">
            {movies.map((movie) => (
              <CarouselItem key={movie.id} className="pl-1 basis-auto">
                <div className="w-64">
                  <OptimizedMovieCard movie={movie} />
                </div>
              </CarouselItem>
            ))}
          </MovieHoverRow>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </section>
  );

  return (
    <ProtectedRoute>
      {/* Fixed background gradient */}
      <div
        className="fixed inset-0"
        style={{
          background: `
      linear-gradient(
        200deg,
        rgb(249 115 22) 0%,
        rgb(194 65 12) 20%,
        black 45%,
        black 100%    
      )
    `,
        }}
      ></div>

      <div className="relative min-h-screen text-white">
        {/* Navigation is now global, do not render Navbar here */}
        <div className="pt-16">
          {/* Main Layout */}
          {movieContent.all.length > 0 ? (
            <>
              {/* Top Section */}
              <div className="max-w-full px-2 py-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-6 px-4">
                  {/* Left - Hero Banner */}
                  <div className="lg:col-span-2">
                    <HeroBanner movies={movieContent.featured} />
                  </div>
                  {/* Right - Top Ranked */}
                  <div>
                    <h2 className="text-2xl font-bold mb-3">
                      Top Ranked Movies
                    </h2>
                    <div
                      className="flex flex-col space-y-3 w-full"
                      style={{ height: "calc(60vh - 2rem)" }}
                    >
                      {movieContent.topRanked
                        .slice(0, 5)
                        .map((movie, index) => (
                          <div
                            key={movie.id}
                            className="relative flex items-center bg-black/40 backdrop-blur-md rounded-lg shadow-lg p-2 group border-2 border-white/10 hover:border-brand-500/50 min-h-[60px] h-[calc((60vh-2rem)/5-0.5rem)] cursor-pointer transition-all duration-300"
                            onClick={() => handleCardClick(movie)}
                          >
                            {/* Ranking Badge */}
                            <div className="absolute -left-6 top-1/2 -translate-y-1/2 z-10">
                              <span className="bg-[#131313] text-white text-base font-bold px-3 py-1 rounded-full border-2 border-brand-500/50 shadow-lg backdrop-blur-sm">
                                #{index + 1}
                              </span>
                            </div>
                            {/* Poster Image */}
                            <img
                              src={movie.posterUrl}
                              alt={movie.title}
                              className="w-16 h-20 object-cover rounded-lg mr-3 flex-shrink-0 border-1 border-brand-500/10 shadow-lg"
                            />
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white text-base mb-0.5 line-clamp-1">
                                {movie.title}
                              </h3>
                              <div className="flex items-center space-x-2 text-xs text-gray-300 mb-0.5">
                                <span>{movie.year}</span>
                                <span>•</span>
                                <span className="flex items-center">
                                  <span className="text-yellow-400">★</span>{" "}
                                  {movie.rating}
                                </span>
                              </div>
                              <div className="flex justify-end">
                                <span className="inline-block bg-black/60 text-xs text-white px-2 py-0.5 rounded">
                                  {movie.genre}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                    {selectedMovie &&
                      (() => {
                        // Match MovieCard modal logic
                        const isSaved = favoriteIds.includes(selectedMovie.id);
                        const contentItem = rawContent.find(
                          (item) => item.id === selectedMovie.id,
                        );
                        const videoUrl = contentItem?.video_url;
                        const channel = channels.find(
                          (ch) => ch.id === selectedMovie.channelId,
                        );
                        console.log('🐛 [Movies Page] Debug More Like This filtering:');
                        console.log('Selected movie:', selectedMovie.title, 'ID:', selectedMovie.id, 'Genre:', selectedMovie.genre);
                        console.log('Total rawContent before filtering:', rawContent.length);
                        
                        const recommendedContent = rawContent
                          .filter(
                            (item) => {
                              const passesId = item.id !== selectedMovie.id;
                              // If current movie is kids content, show only kids content in recommendations
                              // If current movie is not kids content, exclude kids content from recommendations
                              const passesKids = selectedMovie.is_kids || contentItem?.is_kids 
                                ? item.is_kids === true  // Show only kids content
                                : !item.is_kids;         // Exclude kids content
                              const passesGenre = item.genre === selectedMovie.genre ||
                                item.channel_id === selectedMovie.channelId;
                              
                              console.log(`[Movies Page] Item: ${item.title} | ID match: ${passesId} | Kids filter: ${passesKids} (is_kids: ${item.is_kids}, current movie is_kids: ${selectedMovie.is_kids || contentItem?.is_kids}) | Genre/Channel match: ${passesGenre}`);
                              
                              return passesId && passesKids && passesGenre;
                            }
                          )
                          .slice(0, 6);
                        const handleSaveModal = () => {
                          if (isSaved) {
                            removeFromFavorites(selectedMovie.id);
                          } else {
                            addToFavorites(selectedMovie.id);
                          }
                        };
                        const handleModalPlayClick = () => {
                          if (videoUrl) {
                            setIsFullscreen(true);
                          }
                        };
                        const handleExitFullscreen = () => {
                          setIsFullscreen(false);
                        };
                        return (
                          <>
                            {isFullscreen && videoUrl && (
                              <FullscreenPlayer
                                isOpen={isFullscreen}
                                onClose={handleExitFullscreen}
                                videoUrl={videoUrl}
                                title={selectedMovie.title}
                              />
                            )}
                            <MovieModal
                              isOpen={!!selectedMovie && !isFullscreen}
                              onClose={() => setSelectedMovie(null)}
                              movie={selectedMovie}
                              isSaved={isSaved}
                              onSave={handleSaveModal}
                              onPlay={handleModalPlayClick}
                              videoUrl={videoUrl}
                              contentItem={contentItem}
                              channel={channel}
                              recommendedContent={recommendedContent}
                            />
                          </>
                        );
                      })()}
                  </div>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="mb-4 px-6">
                <FilterBar
                  activeGenre={activeGenre}
                  onGenreChange={handleGenreChange}
                  availableGenres={availableMovieGenres}
                />
              </div>

              {/* Content Sections */}
              <div className="max-w-full px-6">
                {activeGenre === "all" ? (
                  // Show all movie rows when "All" is selected
                  <>
                    {/* New Movies - Sort by created_at (newest first) */}
                    {(() => {
                      const newMovies = movieContent.all
                        .filter((movie) => movie.created_at)
                        .sort(
                          (a, b) =>
                            new Date(b.created_at).getTime() -
                            new Date(a.created_at).getTime(),
                        )
                        .slice(0, 8);

                      return (
                        newMovies.length > 0 && (
                          <HomeRow
                            title="New Movies"
                            items={newMovies}
                            onCardClick={handleHomeRowCardClick}
                          />
                        )
                      );
                    })()}

                    {/* Continue Watching - Show trending movies */}
                    {movieContent.trending.length > 0 && (
                      <HomeRow
                        title="Continue Watching"
                        items={movieContent.trending.slice(0, 8)}
                        onCardClick={handleHomeRowCardClick}
                      />
                    )}

                    {/* Recommended */}
                    {movieContent.recommended.length > 0 && (
                      <HomeRow
                        title="Recommended"
                        items={movieContent.recommended.slice(0, 8)}
                        onCardClick={handleHomeRowCardClick}
                      />
                    )}

                    {/* Comedy */}
                    {movieContent.byGenre.Comedy &&
                      movieContent.byGenre.Comedy.length > 0 && (
                        <HomeRow
                          title="Comedy"
                          items={movieContent.byGenre.Comedy.slice(0, 8)}
                          onCardClick={handleHomeRowCardClick}
                        />
                      )}

                    {/* Drama */}
                    {movieContent.byGenre.Drama &&
                      movieContent.byGenre.Drama.length > 0 && (
                        <HomeRow
                          title="Drama"
                          items={movieContent.byGenre.Drama.slice(0, 8)}
                          onCardClick={handleHomeRowCardClick}
                        />
                      )}

                    {/* Sports */}
                    {movieContent.byGenre.Sports &&
                      movieContent.byGenre.Sports.length > 0 && (
                        <HomeRow
                          title="Sports"
                          items={movieContent.byGenre.Sports.slice(0, 8)}
                          onCardClick={handleHomeRowCardClick}
                        />
                      )}

                    {/* Romance */}
                    {movieContent.byGenre.Romance &&
                      movieContent.byGenre.Romance.length > 0 && (
                        <HomeRow
                          title="Romance"
                          items={movieContent.byGenre.Romance.slice(0, 8)}
                          onCardClick={handleHomeRowCardClick}
                        />
                      )}

                    {/* Action */}
                    {movieContent.byGenre.Action &&
                      movieContent.byGenre.Action.length > 0 && (
                        <HomeRow
                          title="Action"
                          items={movieContent.byGenre.Action.slice(0, 8)}
                          onCardClick={handleHomeRowCardClick}
                        />
                      )}

                    {/* Lifestyle */}
                    {movieContent.byGenre.Lifestyle &&
                      movieContent.byGenre.Lifestyle.length > 0 && (
                        <HomeRow
                          title="Lifestyle"
                          items={movieContent.byGenre.Lifestyle.slice(0, 8)}
                          onCardClick={handleHomeRowCardClick}
                        />
                      )}

                    {/* Documentary */}
                    {movieContent.byGenre.Documentary &&
                      movieContent.byGenre.Documentary.length > 0 && (
                        <HomeRow
                          title="Documentary"
                          items={movieContent.byGenre.Documentary.slice(0, 8)}
                          onCardClick={handleHomeRowCardClick}
                        />
                      )}

                    {/* Informational */}
                    {movieContent.byGenre.Informational &&
                      movieContent.byGenre.Informational.length > 0 && (
                        <HomeRow
                          title="Informational"
                          items={movieContent.byGenre.Informational.slice(0, 8)}
                          onCardClick={handleHomeRowCardClick}
                        />
                      )}
                  </>
                ) : (
                  // Show filtered content for specific genre
                  <>
                    {filteredMovies.length > 0 && (
                      <>
                        {/* New content row */}
                        <HomeRow
                          title="New Movies"
                          items={filteredMovies.slice(0, 8)}
                          onCardClick={handleHomeRowCardClick}
                        />

                        {/* Recommended row */}
                        <HomeRow
                          title="Recommended"
                          items={filteredMovies.slice(2, 10)}
                          onCardClick={handleHomeRowCardClick}
                        />
                      </>
                    )}

                    {/* Grid Layout for all filtered movies */}
                    <div className="mt-8 mb-8 pl-4">
                      <h2 className="text-xl font-semibold mb-4">All Movies</h2>

                      {filteredMovies.length > 0 ? (
                        <ContentGrid
                          items={filteredMovies}
                          onCardClick={handleHomeRowCardClick}
                        />
                      ) : (
                        <div className="text-center py-16">
                          <h3 className="text-xl font-bold mb-2">
                            No movies found
                          </h3>
                          <p className="text-gray-400">
                            No {activeGenre} movies available at the moment
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <h2 className="text-2xl font-bold mb-4">No movies available</h2>
              <p className="text-gray-400">
                Movies will appear here once they're added to the platform
              </p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Movies;
