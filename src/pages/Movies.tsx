import { useState } from "react";
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

  // Debug log for Movies page content
  console.log('🎬 [Movies] Page content loaded:', {
    isLoading,
    totalMovies: movieContent.all.length,
    featuredMovies: movieContent.featured.length,
    trendingMovies: movieContent.trending.length,
    topRankedMovies: movieContent.topRanked.length,
    recommendedMovies: movieContent.recommended.length,
    newMovies: movieContent.new.length,
    genreBreakdown: Object.entries(movieContent.byGenre).map(([genre, movies]) => ({
      genre,
      count: movies.length,
      titles: movies.slice(0, 3).map(m => m.title)
    })).filter(g => g.count > 0),
    sampleMovieTitles: movieContent.all.slice(0, 5).map(m => m.title)
  });
  const { favoriteIds, addToFavorites, removeFromFavorites } =
    useUserFavorites();
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
      <div className="fixed inset-0 bg-gradient-to-t from-black via-brand-800 to-brand-500"></div>

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
                      className="flex flex-col space-y-2 w-full"
                      style={{ height: "calc(60vh - 2rem)" }}
                    >
                      {movieContent.topRanked
                        .slice(0, 5)
                        .map((movie, index) => (
                          <div
                            key={movie.id}
                            className="relative flex items-center bg-gray-800 rounded-lg shadow-lg p-2 group border-2 border-transparent hover:border-blue-500 hover:border-opacity-80 min-h-[60px] h-[calc((60vh-2rem)/5-0.5rem)] cursor-pointer"
                            onClick={() => handleCardClick(movie)}
                          >
                            {/* Ranking Badge */}
                            <div className="absolute -left-6 top-1/2 -translate-y-1/2 z-10">
                              <span className="bg-blue-600 text-white text-base font-bold px-3 py-1 rounded-full shadow-lg border-4 border-gray-900">
                                #{index + 1}
                              </span>
                            </div>
                            {/* Poster Image */}
                            <img
                              src={movie.posterUrl}
                              alt={movie.title}
                              className="w-16 h-20 object-cover rounded-lg mr-3 flex-shrink-0 border-2 border-gray-700"
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
                              <span className="inline-block bg-black/60 text-xs text-white px-2 py-0.5 rounded">
                                {movie.genre}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                    {selectedMovie &&
                      (() => {
                        // Match MovieCard modal logic
                        const isSaved = favoriteIds.includes(selectedMovie.id);
                        const contentItem = content.find(
                          (item) => item.id === selectedMovie.id,
                        );
                        const videoUrl = contentItem?.video_url;
                        const channel = channels.find(
                          (ch) => ch.id === selectedMovie.channelId,
                        );
                        const recommendedContent = content
                          .filter(
                            (item) =>
                              item.id !== selectedMovie.id &&
                              (item.genre === selectedMovie.genre ||
                                item.channel_id === selectedMovie.channelId),
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

              {/* Content Rows */}
              <div className="max-w-full p-4 px-8">
                <ContentRow
                  title="New Movies"
                  movies={movieContent.new.length > 0 ? movieContent.new : movieContent.all.slice(0, 20)}
                />
                <ContentRow
                  title="Continue Watching"
                  movies={movieContent.recommended.length > 0 ? movieContent.recommended.slice(0, 15) : movieContent.all.slice(5, 20)}
                />
                <ContentRow
                  title="Recommended"
                  movies={movieContent.recommended.length > 0 ? movieContent.recommended : movieContent.all.slice(10, 30)}
                />
                <ContentRow
                  title="Comedy"
                  movies={movieContent.byGenre.Comedy?.length > 0 ? movieContent.byGenre.Comedy : movieContent.all.filter(m => m.genre?.toLowerCase().includes('comedy')).slice(0, 20) || movieContent.all.slice(15, 35)}
                />
                <ContentRow
                  title="Drama"
                  movies={movieContent.byGenre.Drama?.length > 0 ? movieContent.byGenre.Drama : movieContent.all.filter(m => m.genre?.toLowerCase().includes('drama')).slice(0, 20) || movieContent.all.slice(20, 40)}
                />
                <ContentRow
                  title="Sports"
                  movies={movieContent.byGenre.Sports?.length > 0 ? movieContent.byGenre.Sports : movieContent.all.filter(m => m.genre?.toLowerCase().includes('sport')).slice(0, 20) || movieContent.all.slice(25, 45)}
                />
                <ContentRow
                  title="Romance"
                  movies={movieContent.byGenre.Romance?.length > 0 ? movieContent.byGenre.Romance : movieContent.all.filter(m => m.genre?.toLowerCase().includes('romance')).slice(0, 20) || movieContent.all.slice(30, 50)}
                />
                <ContentRow
                  title="Action"
                  movies={movieContent.byGenre.Action?.length > 0 ? movieContent.byGenre.Action : movieContent.all.filter(m => m.genre?.toLowerCase().includes('action')).slice(0, 20) || movieContent.all.slice(35, 55)}
                />
                <ContentRow
                  title="Lifestyle"
                  movies={movieContent.byGenre.Lifestyle?.length > 0 ? movieContent.byGenre.Lifestyle : movieContent.all.filter(m => m.genre?.toLowerCase().includes('lifestyle')).slice(0, 20) || movieContent.all.slice(40, 60)}
                />
                <ContentRow
                  title="Documentary"
                  movies={movieContent.byGenre.Documentary?.length > 0 ? movieContent.byGenre.Documentary : movieContent.all.filter(m => m.genre?.toLowerCase().includes('documentary')).slice(0, 20) || movieContent.all.slice(45, 65)}
                />
                <ContentRow
                  title="Informational"
                  movies={movieContent.byGenre.Informational?.length > 0 ? movieContent.byGenre.Informational : movieContent.all.filter(m => m.genre?.toLowerCase().includes('informational')).slice(0, 20) || movieContent.all.slice(50, 70)}
                />
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
