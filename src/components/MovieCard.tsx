import { Star, Heart, Play } from "lucide-react";
import { Movie } from "@/data/mockMovies";
import { useState } from "react";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import { useContent } from "@/hooks/useContent";
import { useChannels } from "@/hooks/useChannels";
import MovieModal from "@/components/MovieModal";
import FullscreenPlayer from "@/components/FullscreenPlayer";

interface MovieCardProps {
  movie: Movie;
  showSaveButton?: boolean;
  showProgress?: boolean;
  progressPercent?: number;
  showResumeButton?: boolean;
  onPlayFullscreen?: (videoUrl: string) => void;
  onOpen?: () => boolean;
}

const MovieCard = ({ 
  movie, 
  showSaveButton = true, 
  showProgress = false, 
  progressPercent = 0,
  showResumeButton = false,
  onPlayFullscreen,
  onOpen
}: MovieCardProps) => {
  const { favoriteIds, addToFavorites, removeFromFavorites } = useUserFavorites();
  const { content } = useContent();
  const { channels } = useChannels();
  const [showModal, setShowModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check if movie is in favorites
  const isSaved = favoriteIds.includes(movie.id);

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSaved) {
      removeFromFavorites(movie.id);
    } else {
      addToFavorites(movie.id);
    }
  };

  const handleCardClick = () => {
    // If onOpen returns true, it means the login modal was shown and we should NOT open the card modal
    if (onOpen && onOpen() === true) {
      return;
    }
    setShowModal(true);
  };

  const handleModalPlayClick = () => {
    console.log('Modal play button clicked for movie:', movie.title);
    
    // Find the content item from backend data
    const contentItem = content.find(item => item.id === movie.id);
    console.log('Found content item:', contentItem);
    
    if (contentItem?.video_url) {
      console.log('Video URL found:', contentItem.video_url);
      
      if (onPlayFullscreen) {
        // If we have a fullscreen callback (from ChannelModal), use it
        console.log('Using external fullscreen callback');
        onPlayFullscreen(contentItem.video_url);
        setShowModal(false);
      } else {
        // Close modal first, then open fullscreen player after a delay
        console.log('Using internal fullscreen player');
        setShowModal(false);
        // Delay ensures modal is fully closed and DOM is clean
        setTimeout(() => {
          console.log('Opening fullscreen player');
          setIsFullscreen(true);
        }, 200);
      }
    } else {
      console.log('No video URL found for content item');
    }
  };

  const handleExitFullscreen = () => {
    console.log('Exiting fullscreen for movie:', movie.title);
    setIsFullscreen(false);
  };

  const handleSaveModal = () => {
    if (isSaved) {
      removeFromFavorites(movie.id);
    } else {
      addToFavorites(movie.id);
    }
  };

  // Get recommended content from backend (same channel or genre)
  const recommendedContent = content
    .filter(item => 
      item.id !== movie.id && 
      (item.genre === movie.genre || item.channel_id === movie.channelId)
    )
    .slice(0, 6);

  // Get the video URL from backend content
  const contentItem = content.find(item => item.id === movie.id);
  const videoUrl = contentItem?.video_url;

  // Get channel information
  const channel = channels.find(ch => ch.id === movie.channelId);

  return (
    <>
      {/* Fullscreen Movie Player - Only render when actually needed */}
      {isFullscreen && videoUrl && (
        <FullscreenPlayer
          isOpen={isFullscreen}
          onClose={handleExitFullscreen}
          videoUrl={videoUrl}
          title={movie.title}
        />
      )}

      <div className="movie-card group rounded-lg">
        <div className="block cursor-pointer rounded-lg" onClick={handleCardClick}>
          <div className="relative overflow-hidden rounded-lg bg-gray-800 shadow-lg"
               style={{ aspectRatio: '16/9' }}>
            <div className="w-full h-full rounded-lg overflow-hidden">
              <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-full h-full rounded-lg object-cover transform transition-transform duration-300 hover:scale-[1.1]"
              />
            </div>
            
            {/* Progress Bar */}
            {showProgress && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600">
                <div 
                  className="h-full bg-red-600 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}

            {/* Gradient overlays inside card */}
            <div className="absolute inset-0 z-0 rounded-lg overflow-hidden pointer-events-none">
              {/* Base gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
              {/* Darker gradient on hover */}
              <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/90 via-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Title text positioned above the gradient */}
            <div className="absolute bottom-0 left-0 right-0 z-10 p-3 pt-6 pointer-events-none">
              <h3 className="font-medium text-white text-md line-clamp-2 transform transition-transform duration-300 origin-left group-hover:scale-[1.1]">
                {movie.title}
              </h3>
            </div>

            {/* Resume Button Overlay */}
            {showResumeButton && (
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <button className="bg-white text-black px-4 py-2 rounded-lg font-semibold flex items-center space-x-2">
                  <Play className="w-4 h-4" />
                  <span>Resume</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Netflix-style Movie Modal - Only show when not in fullscreen */}
      <MovieModal
        isOpen={showModal && !isFullscreen}
        onClose={setShowModal}
        movie={movie}
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
};

export default MovieCard;
