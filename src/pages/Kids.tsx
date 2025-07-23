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

const Kids = () => {
  const { movieContent, isLoading } = useAppContent();
  const [selectedMovie, setSelectedMovie] = useState(null);
  const { favoriteIds, addToFavorites, removeFromFavorites } = useUserFavorites();
  const { content } = useContent();
  const { channels } = useChannels();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Filter content for kids (you can adjust this filter based on your data structure)
  const kidsContent = useMemo(() => {
    if (!movieContent.all) return { all: [], featured: [], topRanked: [], recommended: [], trending: [], new: [], byGenre: {} };
    
    const kidsMovies = movieContent.all.filter(movie => 
      movie.genre?.toLowerCase().includes('kids') || 
      movie.genre?.toLowerCase().includes('family') ||
      movie.genre?.toLowerCase().includes('animation') ||
      movie.genre?.toLowerCase().includes('children')
    );

    return {
      all: kidsMovies,
      featured: kidsMovies.slice(0, 5),
      topRanked: kidsMovies.slice(0, 10),
      recommended: kidsMovies.slice(0, 20),
      trending: kidsMovies.slice(5, 25),
      new: kidsMovies.slice(10, 30),
      byGenre: {
        'Animation': kidsMovies.filter(m => m.genre?.toLowerCase().includes('animation')),
        'Family': kidsMovies.filter(m => m.genre?.toLowerCase().includes('family')),
        'Adventure': kidsMovies.filter(m => m.genre?.toLowerCase().includes('adventure')),
      }
    };
  }, [movieContent]);

  // Add click logic for Top Ranked
  const handleCardClick = (movie) => {
    setSelectedMovie(movie);
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-sky-400 via-blue-300 to-yellow-300 text-white flex items-center justify-center">
          <div className="text-2xl font-bold text-blue-800">Loading Kids Content...</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-sky-400 via-blue-300 to-yellow-300 text-white">
        {/* Navigation is now global, do not render Navbar here */}
        <div className="pt-16">
          {/* Main Layout */}
          {kidsContent.all.length > 0 ? (
            <>
              {/* Top Section */}
              <div className="max-w-full px-2 py-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-6 px-4">
                  {/* Left - Hero Banner */}
                  <div className="lg:col-span-2">
                    <HeroBanner movies={kidsContent.featured} />
                  </div>
                  {/* Right - Top Ranked */}
                  <div>
                    <h2 className="text-2xl font-bold mb-3 text-blue-800">Top Kids Shows</h2>
                    <div className="flex flex-col space-y-2 w-full" style={{ height: 'calc(60vh - 2rem)' }}>
                      {kidsContent.topRanked.slice(0, 5).map((movie, index) => (
                        <div
                          key={movie.id}
                          className="relative flex items-center bg-white/20 backdrop-blur-sm rounded-lg shadow-lg p-2 group border-2 border-transparent hover:border-yellow-400 hover:border-opacity-80 min-h-[60px] h-[calc((60vh-2rem)/5-0.5rem)] cursor-pointer"
                          onClick={() => handleCardClick(movie)}
                        >
                          {/* Ranking Badge */}
                          <div className="absolute -left-6 top-1/2 -translate-y-1/2 z-10">
                            <span className="bg-yellow-500 text-blue-800 text-base font-bold px-3 py-1 rounded-full shadow-lg border-4 border-white">#{index + 1}</span>
                          </div>
                          {/* Poster Image */}
                          <img
                            src={movie.posterUrl}
                            alt={movie.title}
                            className="w-16 h-20 object-cover rounded-lg mr-3 flex-shrink-0 border-2 border-white/50"
                          />
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-blue-800 text-base mb-0.5 line-clamp-1">{movie.title}</h3>
                            <div className="flex items-center space-x-2 text-xs text-blue-700 mb-0.5">
                              <span>{movie.year}</span>
                              <span>•</span>
                              <span className="flex items-center"><span className="text-yellow-500">★</span> {movie.rating}</span>
                            </div>
                            <span className="inline-block bg-blue-600/60 text-xs text-white px-2 py-0.5 rounded">{movie.genre}</span>
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
                <ContentRow title="Recommended for Kids" movies={kidsContent.recommended} />
                <ContentRow title="Popular Kids Shows" movies={kidsContent.trending} />
                <ContentRow title="New Kids Content" movies={kidsContent.new} />
                {/* Genre Sections */}
                {Object.entries(kidsContent.byGenre).map(([genre, genreMovies]) => (
                  genreMovies.length > 0 && (
                    <ContentRow key={genre} title={genre} movies={genreMovies} />
                  )
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <h2 className="text-2xl font-bold mb-4 text-blue-800">No Kids Content Available</h2>
              <div className="text-6xl mb-4">🎈</div>
              <p className="text-blue-700">Fun kids shows and movies will appear here soon!</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Kids;