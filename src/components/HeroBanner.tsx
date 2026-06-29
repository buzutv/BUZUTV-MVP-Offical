import { useState } from "react";
import { ChevronLeft, ChevronRight, Info, Play, X } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "./HeroCarousel.css";
import { Movie } from "@/data/mockMovies";
import { useContent } from "@/hooks/useContent";
import { useChannels } from "@/hooks/useChannels";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import BrandButton from "@/components/ui/BrandButton";
import ContentModal from "./ContentModal";

interface HeroBannerProps {
  movies: Movie[];
  variant?: "default" | "kids";
}

// Helper function to convert YouTube URLs to embed format
const getYouTubeEmbedUrl = (url: string): string | null => {
  if (!url) return null;

  // Extract video ID from various YouTube URL formats
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);

  if (match && match[2].length === 11) {
    const videoId = match[2];
    return `https://www.youtube.com/embed/${videoId}`;
  }

  return null;
};

const HeroBanner = ({ movies, variant = "default" }: HeroBannerProps) => {
  const [showModal, setShowModal] = useState(false);
  const [modalMovie, setModalMovie] = useState<Movie | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(
    movies[0] || null,
  );
  const { content } = useContent();
  const { channels } = useChannels();
  const { favoriteIds, addToFavorites, removeFromFavorites } =
    useUserFavorites();

  // Helper to get first episode video for series
  const getFirstEpisodeVideo = (item: any) => {
    if (item?.type === "series" && item?.seasons_data) {
      let seasonsData = item.seasons_data;
      if (typeof seasonsData === "string") {
        try {
          seasonsData = JSON.parse(seasonsData);
        } catch {
          // Parsing failed, continue with original data
        }
      }
      if (
        Array.isArray(seasonsData) &&
        seasonsData.length > 0 &&
        seasonsData[0].episodes &&
        seasonsData[0].episodes.length > 0
      ) {
        const firstEp = seasonsData[0].episodes[0];
        const videoUrl = firstEp.videoUrl || firstEp.video_url;
        return { videoUrl, title: `${item.title} - ${firstEp.title}` };
      }
    }
    return null;
  };

  const handleWatchNow = () => {
    if (!currentMovie) return;
    const contentItem = content.find((item) => item.id === currentMovie.id);
    if (contentItem?.video_url) {
      setIsPlaying(true);
    }
  };

  const handleMoreInfo = () => {
    if (!currentMovie) return;
    setModalMovie(currentMovie);
    setShowModal(true);
  };

  // For fullscreen video
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
  const [currentVideoTitle, setCurrentVideoTitle] = useState<string | null>(
    null,
  );
  const handleCloseVideo = () => {
    setIsPlaying(false);
    setCurrentVideoUrl(null);
    setCurrentVideoTitle(null);
  };

  const handleModalPlayClick = () => {
    // Find the content item from backend data
    const contentItem = content.find((item) => item.id === modalMovie?.id);
    if (contentItem?.video_url) {
      setIsPlaying(true);
    }
  };

  const handleSave = () => {
    if (!modalMovie) return;

    if (isSaved) {
      removeFromFavorites(modalMovie.id);
    } else {
      addToFavorites(modalMovie.id);
    }
  };

  if (movies.length === 0) return null;

  // Get the video URL from backend content for current movie
  const contentItem = currentMovie
    ? content.find((item) => item.id === currentMovie.id)
    : null;
  const videoUrl = contentItem?.video_url;
  const embedUrl = videoUrl ? getYouTubeEmbedUrl(videoUrl) || videoUrl : null;

  // Get modal movie data
  const modalContentItem = modalMovie
    ? content.find((item) => item.id === modalMovie.id)
    : null;
  const modalVideoUrl = modalContentItem?.video_url;
  const modalEmbedUrl = modalVideoUrl
    ? getYouTubeEmbedUrl(modalVideoUrl) || modalVideoUrl
    : null;
  // For series, get seasons_data
  const modalSeasonsData =
    modalMovie && modalMovie.type === "series" && modalContentItem
      ? modalContentItem.seasons_data
      : undefined;

  // Get channel information for modal
  const channel = modalMovie
    ? channels.find((ch) => ch.id === modalMovie.channelId)
    : null;

  // Check if modal movie is in favorites
  const isSaved = modalMovie ? favoriteIds.includes(modalMovie.id) : false;

  // This will be handled internally by ContentModal using useMoreLikeThis hook
  const recommendedContent = [];

  // Format duration from minutes to "Xh Ym" format
  const formatDuration = (minutes: number | undefined | null) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  // Determine if Watch Now should be enabled
  const watchNowEnabled = !!contentItem?.video_url;

  // Color variants for kids theme
  const isKidsVariant = variant === "kids";
  const playButtonClass = isKidsVariant
    ? "bg-blue-500 hover:bg-blue-600 text-white shadow-[2px_19px_31px_rgba(59,130,246,0.35)]"
    : "bg-brand-500 hover:bg-brand-600 text-white shadow-[2px_19px_31px_rgba(30,27,95,0.35)]";
  const infoBorderClass = isKidsVariant
    ? "border-blue-400"
    : "border-brand-500";
  const genreBgClass = isKidsVariant ? "bg-blue-500/70" : "bg-brand-500/70";

  return (
    <>
      <div className="relative w-full h-[60vh] overflow-hidden">
        <Swiper
          modules={[Navigation, Autoplay, Pagination]}
          slidesPerView={1}
          navigation={{
            prevEl: ".hero-prev-movies",
            nextEl: ".hero-next-movies",
          }}
          pagination={{
            clickable: true,
            bulletClass: "swiper-pagination-bullet-movies",
            bulletActiveClass: "swiper-pagination-bullet-movies-active",
          }}
          autoplay={
            isPlaying || showModal
              ? false
              : { delay: 5000, disableOnInteraction: false }
          }
          loop={movies.length > 1}
          className="h-full w-full"
          onSlideChange={(swiper) => {
            if (!isPlaying) {
              const newMovie = movies[swiper.realIndex] || movies[0];
              setCurrentMovie(newMovie);
            }
          }}
          onSliderFirstMove={(swiper) => {
            // Ensure currentMovie is set on first interaction
            const newMovie = movies[swiper.realIndex] || movies[0];
            if (
              newMovie &&
              (!currentMovie || currentMovie.id !== newMovie.id)
            ) {
              setCurrentMovie(newMovie);
            }
          }}
        >
          {movies.map((movie, idx) => (
            <SwiperSlide key={movie.id || idx}>
              <div className="relative w-full h-full">
                {/* Background */}
                <div
                  className="absolute inset-0 bg-center bg-no-repeat bg-cover hero-slide"
                  style={{
                    backgroundImage: `url(${movie.posterUrl})`,
                  }}
                >
                  {/* Left-to-right overlay */}
                  <div
                    className={`absolute inset-0 ${
                      isKidsVariant
                        ? ""
                        : "bg-gradient-to-r from-black/50 via-black/30 to-transparent"
                    }`}
                  />

                  {/* Bottom-to-top overlay – make bottom darker */}
                  <div
                    className={`absolute inset-0 ${
                      isKidsVariant
                        ? "bg-[linear-gradient(to_top,_rgba(37,99,235,0.9)_0%,_rgba(37,99,235,0.5)_20%,_transparent_70%)]"
                        : "bg-gradient-to-t from-black via-black/30 to-transparent"
                    }`}
                  />
                </div>

                {/* Content - Positioned with more bottom spacing */}
                <div className="relative z-10 flex items-end h-full pb-2 md:pb-8">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    <div className="max-w-xl">
                      <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white">
                        {currentMovie?.title}
                      </h1>

                      <div className="flex items-center space-x-3 mb-6">
                        <span
                          className={`${genreBgClass} text-white px-2 py-1 rounded text-sm`}
                        >
                          {currentMovie?.genre}
                        </span>
                        <span className="text-white text-sm">
                          {currentMovie?.year}
                        </span>
                        {/* Duration/Seasons - show duration for movies, seasons for series */}
                        {(() => {
                          if (currentMovie?.type === "series") {
                            // For series, show number of seasons - using same logic as FullViewportHero
                            if (contentItem?.seasons_data) {
                              try {
                                const seasonsData =
                                  typeof contentItem.seasons_data === "string"
                                    ? JSON.parse(contentItem.seasons_data)
                                    : contentItem.seasons_data;
                                
                                if (Array.isArray(seasonsData) && seasonsData.length > 0) {
                                  const seasonCount = seasonsData.length;
                                  return (
                                    <span className="text-white text-sm">
                                      {seasonCount === 1 ? "1 Season" : `${seasonCount} Seasons`}
                                    </span>
                                  );
                                }
                              } catch (error) {
                                console.error("Error parsing seasons data for duration display:", error);
                              }
                            }
                            
                            // Fallback for series
                            return (
                              <span className="text-white text-sm">
                                Series
                              </span>
                            );
                          } else {
                            // For movies, show duration
                            const movieDuration =
                              contentItem?.duration_minutes ||
                              currentMovie?.duration;

                            return movieDuration ? (
                              <span className="text-white text-sm">
                                {formatDuration(movieDuration)}
                              </span>
                            ) : null;
                          }
                        })()}
                        <div className="flex items-center space-x-1">
                          <span className="text-yellow-400">★</span>
                          <span className="text-white text-sm">
                            {currentMovie?.rating}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 mb-6">
                        {/* Only show Play button if not a series */}
                        {currentMovie?.type !== "series" && (
                          <BrandButton
                            onClick={handleWatchNow}
                            disabled={!watchNowEnabled}
                            variant={
                              watchNowEnabled
                                ? variant === "kids"
                                  ? "kids"
                                  : "primary"
                                : "ghost"
                            }
                            size="sm"
                            className={
                              !watchNowEnabled
                                ? "!bg-gray-600 !text-gray-400 !cursor-not-allowed !hover:bg-gray-600 !hover:-translate-y-0"
                                : ""
                            }
                          >
                            <Play className="w-4 h-4 fill-current" />
                            <span>Watch Now</span>
                          </BrandButton>
                        )}
                        {/* For series, show a non-clickable pill instead of More Info */}
                        {currentMovie?.type === "series" ? (
                          <BrandButton
                            variant={
                              variant === "kids" ? "kidsSecondary" : "secondary"
                            }
                            size="sm"
                            className="cursor-default select-none"
                          >
                            Watch Now Below!
                          </BrandButton>
                        ) : (
                          <BrandButton
                            onClick={handleMoreInfo}
                            variant={
                              variant === "kids" ? "kidsSecondary" : "secondary"
                            }
                            size="sm"
                          >
                            <Info className="w-4 h-4" />
                            <span>More Info</span>
                          </BrandButton>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Navigation buttons */}
        {movies.length > 1 && (
          <>
            <button 
              className="hero-prev-movies absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
              aria-label="Previous movie"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <button 
              className="hero-next-movies absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
              aria-label="Next movie"
            >
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {/* Full Screen Video Player - Fixed positioning */}
      {isPlaying && (
        <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
          {/* Close Button */}
          <button
            onClick={handleCloseVideo}
            className="absolute top-4 right-4 z-[10000] bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          {/* Video Player */}
          <div className="w-full h-full flex items-center justify-center">
            {(() => {
              // Use currentVideoUrl if available (from modal), otherwise use hero's embedUrl
              const videoToPlay = currentVideoUrl || embedUrl;
              const videoTitle = currentVideoTitle || currentMovie?.title;


              if (!videoToPlay) {
                return (
                  <div className="text-white text-center">
                    <p>No video available</p>
                    <button
                      onClick={handleCloseVideo}
                      className="mt-4 px-4 py-2 bg-gray-600 rounded text-white"
                    >
                      Close
                    </button>
                  </div>
                );
              }

              const finalEmbedUrl = videoToPlay.includes("youtube.com/embed")
                ? videoToPlay
                : getYouTubeEmbedUrl(videoToPlay) || videoToPlay;

              return finalEmbedUrl.includes("youtube.com/embed") ? (
                <iframe
                  src={`${finalEmbedUrl}?autoplay=1&controls=1&rel=0&fs=1&playsinline=1`}
                  className="w-full h-full"
                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                  allowFullScreen
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              ) : (
                <video
                  src={finalEmbedUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                  onError={() => {
                    setIsPlaying(false);
                  }}
                />
              );
            })()}
          </div>
        </div>
      )}

      {/* More Info Modal - Using unified ContentModal */}
      {modalMovie && (
        <ContentModal
          isOpen={showModal && !isPlaying}
          onClose={(open) => setShowModal(open)}
          item={modalMovie}
          variant={modalMovie.type || "auto"}
          isKidsMode={variant === "kids"}
          onPlayEpisode={(url, episodeTitle) => {
            setCurrentVideoUrl(url);
            setCurrentVideoTitle(episodeTitle);
            setIsPlaying(true);
          }}
          videoUrl={modalVideoUrl}
          contentItem={{
            ...modalContentItem,
            seasons_data: modalSeasonsData,
          }}
          channel={channel}
          seasons={modalSeasonsData}
          customBackground={
            variant === "kids"
              ? undefined
              : undefined
          }
        />
      )}

      {/* Custom Pagination Styles */}
      <style>{`
        .swiper-pagination-bullet-movies {
          width: 8px;
          height: 8px;
          background: rgba(255, 255, 255, 0.5);
          opacity: 1;
          margin: 0 4px;
          transition: all 0.3s ease;
        }

        .swiper-pagination-bullet-movies-active {
          background: white;
          transform: scale(1.2);
        }
      `}</style>
    </>
  );
};

export default HeroBanner;
