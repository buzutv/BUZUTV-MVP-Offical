import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Heart, Play, Plus, Star } from "lucide-react";
import { mockMovies } from "@/data/mockMovies";
import MovieCard from "@/components/MovieCard";
import FullscreenPlayer from "@/components/FullscreenPlayer";
import React, { useState } from "react";
import { useContent } from "@/hooks/useContent";

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { content } = useContent();

  const movie = mockMovies.find((m) => m.id === id);

  const handleBack = () => {
    const lastMainPage = localStorage.getItem("lastMainPage");
    if (lastMainPage && lastMainPage !== "/") {
      navigate(lastMainPage);
    } else {
      navigate("/");
    }
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
  };

  const handlePlay = () => {
    setIsFullscreen(true);
  };

  const handleExitFullscreen = () => {
    setIsFullscreen(false);
  };

  if (!movie) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Movie Not Found</h1>
          <button
            onClick={handleBack}
            className="text-blue-400 hover:text-blue-300"
          >
            Return to Previous Page
          </button>
        </div>
      </div>
    );
  }

  // Get recommended items (same genre, excluding current movie and kids content)

  const recommendedItems = mockMovies
    .filter((m) => {
      const passesId = m.id !== movie.id;
      const passesGenre = m.genre === movie.genre;
      // If current movie is kids content, show only kids content in recommendations
      // If current movie is not kids content, exclude kids content from recommendations
      const passesKids = movie.isKids
        ? m.isKids === true // Show only kids content
        : !m.isKids; // Exclude kids content

      return passesId && passesGenre && passesKids;
    })
    .slice(0, 6);

  // Get the video URL from backend content
  const contentItem = content.find((item) => item.id === movie.id);
  const videoUrl = contentItem?.video_url || "";

  return (
    <div className="min-h-screen text-white">
      {/* Fixed background gradient */}
      {/* Fixed background gradient */}
      <div
        className="fixed inset-0"
        style={{
          background: `
  linear-gradient(
    200deg,
    #311066 0%,   /* very dark violet */
    #1D0833 20%,  /* deep blackish purple */
    #120222 45%,  /* near-black violet */
    black 100%    /* pure black */
`,
        }}
      ></div>
      <div className="relative">
        {/* Fullscreen Movie Player */}
        <FullscreenPlayer
          isOpen={isFullscreen}
          onClose={handleExitFullscreen}
          videoUrl={videoUrl}
          title={movie.title}
        />

        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
            <div className="flex items-center justify-between h-16">
              <button
                onClick={handleBack}
                className="flex items-center space-x-2"
              >
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 bg-clip-text text-transparent">
                  BUZUTV
                </span>
              </button>
            </div>
          </div>
        </nav>

        <div className="pt-16">
          {/* Back Button */}
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4">
            <button
              onClick={handleBack}
              className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
            {/* Video Preview Section */}
            <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden mb-8 relative group">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                <button
                  onClick={handlePlay}
                  disabled={!videoUrl}
                  className={`p-6 rounded-full transition-all duration-200 hover:scale-110 ${
                    videoUrl
                      ? "bg-white/90 hover:bg-white text-black"
                      : "bg-gray-600 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <Play className="w-12 h-12 fill-current" />
                </button>
              </div>
              {!videoUrl && (
                <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
                  Video not available
                </div>
              )}
            </div>

            {/* Movie Info Section */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-8">
              {/* Left side - Title and details */}
              <div className="flex-1 mb-6 lg:mb-0">
                <h1 className="text-4xl font-bold mb-4">{movie.title}</h1>

                <div className="flex items-center space-x-6 mb-6">
                  <div className="flex items-center space-x-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="text-lg font-semibold">
                      {movie.rating}
                    </span>
                  </div>
                  <span className="text-gray-400">{movie.year}</span>
                  <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 text-white px-3 py-1 rounded text-sm font-medium">
                    {movie.genre}
                  </span>
                </div>

                <p className="text-gray-300 text-lg leading-relaxed mb-6 max-w-3xl">
                  {movie.description}
                </p>

                {/* Action Buttons */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handlePlay}
                    disabled={!videoUrl}
                    className={`flex items-center space-x-3 px-8 py-3 rounded-lg font-semibold transition-colors ${
                      videoUrl
                        ? "bg-white text-black hover:bg-gray-200"
                        : "bg-gray-600 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <Play className="w-6 h-6 fill-current" />
                    <span>Play</span>
                  </button>

                  <button
                    onClick={handleFavorite}
                    className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span>My List</span>
                  </button>

                  <button
                    onClick={handleFavorite}
                    className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                  >
                    <Heart
                      className={`w-6 h-6 ${isFavorited ? "fill-current text-red-500" : "text-gray-400"}`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* More Like This Section */}
            {recommendedItems.length > 0 && (
              <div className="mt-16 pb-8">
                <h2 className="text-2xl font-bold mb-8">More Like This</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {recommendedItems.map((item) => (
                    <div key={item.id} className="w-full">
                      <MovieCard movie={item} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;
