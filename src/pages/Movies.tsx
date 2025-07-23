
import { useState, useMemo } from "react";
import { genres } from "@/data/mockMovies";
import OptimizedMovieCard from "@/components/OptimizedMovieCard";
import MovieHoverRow from "@/components/MovieHoverRow";
import ContentRow from "@/components/ContentRow";
import HeroBanner from "@/components/HeroBanner";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
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
  const { movieContent, isLoading } = useAppContent();
  const [selectedMovie, setSelectedMovie] = useState(null);
  const { favoriteIds, addToFavorites, removeFromFavorites } = useUserFavorites();
  const { content } = useContent();
  const { channels } = useChannels();
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  const MovieRow = ({ title, movies }: { title: string; movies: typeof movieContent.all }) => (
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
      <div className="min-h-screen bg-gray-900 text-white">
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
                    <h2 className="text-2xl font-bold mb-3">Top Ranked Movies</h2>
                    <div className="flex flex-col space-y-2 w-full" style={{ height: 'calc(60vh - 2rem)' }}>
                      {movieContent.topRanked.slice(0, 5).map((movie, index) => (
                        <div
                          key={movie.id}
                          className="relative flex items-center bg-gray-800 rounded-lg shadow-lg p-2 group border-2 border-transparent hover:border-blue-500 hover:border-opacity-80 min-h-[60px] h-[calc((60vh-2rem)/5-0.5rem)] cursor-pointer"
                          onClick={() => handleCardClick(movie)}
                        >
                          {/* Ranking Badge */}
                          <div className="absolute -left-6 top-1/2 -translate-y-1/2 z-10">
                            <span className="bg-blue-600 text-white text-base font-bold px-3 py-1 rounded-full shadow-lg border-4 border-gray-900">#{index + 1}</span>
                          </div>
                          {/* Poster Image */}
                          <img
                            src={movie.posterUrl}
                            alt={movie.title}
                            className="w-16 h-20 object-cover rounded-lg mr-3 flex-shrink-0 border-2 border-gray-700"
                          />
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white text-base mb-0.5 line-clamp-1">{movie.title}</h3>
                            <div className="flex items-center space-x-2 text-xs text-gray-300 mb-0.5">
                              <span>{movie.year}</span>
                              <span>•</span>
                              <span className="flex items-center"><span className="text-yellow-400">★</span> {movie.rating}</span>
                            </div>
                            <span className="inline-block bg-black/60 text-xs text-white px-2 py-0.5 rounded">{movie.genre}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {selectedMovie && (() => {
                      // Match MovieCard modal logic
                      const isSaved = favoriteIds.includes(selectedMovie.id);
                      const contentItem = content.find(item => item.id === selectedMovie.id);
                      const videoUrl = contentItem?.video_url;
                      const channel = channels.find(ch => ch.id === selectedMovie.channelId);
                      const recommendedContent = content
                        .filter(item => item.id !== selectedMovie.id && (item.genre === selectedMovie.genre || item.channel_id === selectedMovie.channelId))
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

              {/* Content Rows */}
              <div className="max-w-full p-4 px-8">
                <ContentRow title="Recommended" movies={movieContent.recommended} />
                <ContentRow title="Trending Movies" movies={movieContent.trending} />
                <ContentRow title="New Movies" movies={movieContent.new} />
                {/* Genre Sections */}
                {Object.entries(movieContent.byGenre).map(([genre, genreMovies]) => (
                  genreMovies.length > 0 && (
                    <ContentRow key={genre} title={genre} movies={genreMovies} />
                  )
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <h2 className="text-2xl font-bold mb-4">No movies available</h2>
              <p className="text-gray-400">Movies will appear here once they're added to the platform</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Movies;
