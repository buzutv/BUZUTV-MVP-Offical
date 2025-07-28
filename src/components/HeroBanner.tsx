import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Info,
  Play,
  Star,
  X,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "./HeroCarousel.css";
import { Movie } from "@/data/mockMovies";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useContent } from "@/hooks/useContent";
import { useChannels } from "@/hooks/useChannels";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import BrandButton from "@/components/ui/BrandButton";
import SeriesModal from "./SeriesModal";
import KidsSeriesModal from "./KidsSeriesModal";
import HomeRow from "./HomeRow";

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

  // Get recommended content from backend (same channel or genre)
  const recommendedContent = modalMovie
    ? (() => {
        const filtered = content.filter((item) => {
          const passesId = item.id !== modalMovie.id;
          // If current movie is kids content, show only kids content in recommendations
          // If current movie is not kids content, exclude kids content from recommendations
          const passesKids =
            modalMovie.isKids || modalContentItem?.is_kids
              ? item.is_kids === true // Show only kids content
              : !item.is_kids; // Exclude kids content
          const passesGenre =
            item.genre === modalMovie.genre ||
            item.channel_id === modalMovie.channelId;

          return passesId && passesKids && passesGenre;
        });

        return filtered.slice(0, 6);
      })()
    : [];

  // Format duration from minutes to "Xh Ym" format
  const formatDuration = (minutes: number | undefined) => {
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
            isPlaying ? false : { delay: 5000, disableOnInteraction: false }
          }
          loop={movies.length > 1}
          className="h-full w-full"
          onSlideChange={(swiper) => {
            if (!isPlaying) {
              setCurrentMovie(movies[swiper.realIndex] || movies[0]);
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
                        ? "bg-gradient-to-t from-blue-400/80 via-blue-400/10 to-transparent"
                        : "bg-gradient-to-t from-black via-black/30 to-transparent"
                    }`}
                  />
                </div>

                {/* Content - Positioned with more bottom spacing */}
                <div className="relative z-10 flex items-end h-full pb-2 md:pb-8">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    <div className="max-w-xl">
                      <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white">
                        {movie.title}
                      </h1>

                      <div className="flex items-center space-x-3 mb-6">
                        <span
                          className={`${genreBgClass} text-white px-2 py-1 rounded text-sm`}
                        >
                          {movie.genre}
                        </span>
                        <span className="text-white text-sm">{movie.year}</span>
                        <div className="flex items-center space-x-1">
                          <span className="text-yellow-400">★</span>
                          <span className="text-white text-sm">
                            {movie.rating}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 mb-6">
                        {/* Only show Play button if not a series */}
                        {movie.type !== "series" && (
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
                        {movie.type === "series" ? (
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
            <button className="hero-prev-movies absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button className="hero-next-movies absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Full Screen Video Player - Fixed positioning */}
      {isPlaying && embedUrl && (
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
            {embedUrl.includes("youtube.com/embed") ? (
              <iframe
                src={`${embedUrl}?autoplay=1&controls=1&rel=0&fs=1&playsinline=1`}
                className="w-full h-full"
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowFullScreen
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            ) : (
              <video
                src={embedUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
                onError={() => {
                  setIsPlaying(false);
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* More Info Modal - Consistent with MovieModal */}
      <Dialog open={showModal && !isPlaying} onOpenChange={setShowModal}>
        <DialogContent
          className={`max-w-[75vw] max-h-[90vh] text-white border-none p-0 overflow-hidden transition-all duration-1000 ease-in-out opacity-0 scale-95 data-[state=open]:opacity-100 data-[state=open]:scale-100 ${variant === "kids" ? "bg-gradient-to-tl from-yellow-300 via-blue-300 to-sky-400" : "bg-gradient-to-br from-black via-slate-900 to-violet-900"}`}
        >
          <DialogTitle className="sr-only">{modalMovie?.title}</DialogTitle>
          <ScrollArea className="h-[90vh] scroll-smooth">
            <div className="relative min-h-full">
              {/* Hero Section with Fixed Gradient */}
              <div className="relative w-full h-[60vh] overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img
                    src={modalMovie?.posterUrl}
                    alt={modalMovie?.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Only bottom gradient for fade effect */}
                <div
                  className={`absolute bottom-0 left-0 right-0 h-48 ${variant === "kids" ? "bg-gradient-to-t from-blue-400 via-blue-400/30 to-transparent" : "bg-gradient-to-t from-black via-black/60 to-transparent"}`}
                />

                {/* Title and Info Container */}
                <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
                  <h1 className="text-5xl font-bold text-white mb-6">
                    {modalMovie?.title}
                  </h1>

                  {/* Action Buttons Row */}
                  <div className="flex items-center space-x-4 mb-4">
                    <BrandButton
                      onClick={handleModalPlayClick}
                      disabled={!modalVideoUrl}
                      variant={
                        modalVideoUrl
                          ? variant === "kids"
                            ? "kids"
                            : "primary"
                          : "ghost"
                      }
                      size="md"
                      className={
                        !modalVideoUrl
                          ? "!bg-gray-600 !text-gray-400 !cursor-not-allowed !hover:bg-gray-600 !hover:-translate-y-0"
                          : ""
                      }
                    >
                      <Play className="w-6 h-6 fill-current" />
                      <span>Play</span>
                    </BrandButton>

                    <button
                      onClick={handleSave}
                      className={`bg-black/20 backdrop-blur-md text-white p-2 rounded-full transition-all duration-200 border ${variant === "kids" ? "border-blue-400/50 hover:border-blue-400" : "border-brand-500/50 hover:border-brand-500"} hover:bg-black/30`}
                    >
                      <Heart
                        className={`w-5 h-5 ${isSaved ? "fill-current text-red-500" : ""}`}
                      />
                    </button>

                    <span className="text-white text-xl font-medium">
                      {formatDuration(modalContentItem?.duration_minutes)}
                    </span>
                  </div>

                  {/* Netflix-style Info Row */}
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-green-400 font-semibold">
                        {modalMovie?.rating}
                      </span>
                    </div>
                    <span className="text-white font-medium">
                      {modalMovie?.year}
                    </span>
                    <span
                      className={`border ${variant === "kids" ? "border-blue-400 px-2 py-0.5 text-xs text-white font-medium bg-blue-500/90" : "border-brand-500 px-2 py-0.5 text-xs text-gray-300 font-medium"}`}
                    >
                      {variant === "kids" ? "KIDS" : "TV-MA"}
                    </span>
                    <span className="text-white">{modalMovie?.genre}</span>
                    {channel?.logo_url && (
                      <img
                        src={channel.logo_url}
                        alt={channel.name}
                        className="w-8 h-8 object-contain rounded"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Content Section - Minimized gap */}
              <div className="p-8 pt-6 pb-0 relative">
                <div
                  className={`absolute top-0 left-0 right-0 h-4 ${variant === "kids" ? "bg-gradient-to-b from-blue-400 to-transparent" : "bg-gradient-to-b from-black to-transparent"} pointer-events-none`}
                />

                {/* More Like This Section */}
                {recommendedContent.length > 0 && (
                  <HomeRow
                    title="More Like This"
                    items={recommendedContent.map((item) => ({
                      ...item,
                      posterUrl: item.poster_url || "/placeholder.svg",
                    }))}
                    isMoreLikeThis={true}
                    onItemClick={(movie) => {
                      setShowModal(false); // Close current modal
                      setModalMovie(movie); // Set new modal movie
                      setShowModal(true); // Open new modal with selected movie
                    }}
                  />
                )}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
        {/* Pass seasons_data to the modal if this is a series */}
        {modalMovie &&
          modalMovie.type === "series" &&
          modalContentItem &&
          (variant === "kids" ? (
            <KidsSeriesModal
              isOpen={showModal && !isPlaying}
              onClose={setShowModal}
              series={modalMovie}
              isSaved={isSaved}
              onSave={handleSave}
              onPlayEpisode={() => {}}
              videoUrl={modalVideoUrl}
              contentItem={{
                ...modalContentItem,
                seasons_data: modalSeasonsData,
              }}
              channel={channel}
              recommendedContent={recommendedContent}
              seasons={modalSeasonsData}
            />
          ) : (
            <SeriesModal
              isOpen={showModal && !isPlaying}
              onClose={setShowModal}
              series={modalMovie}
              isSaved={isSaved}
              onSave={handleSave}
              onPlayEpisode={() => {}}
              videoUrl={modalVideoUrl}
              contentItem={{
                ...modalContentItem,
                seasons_data: modalSeasonsData,
              }}
              channel={channel}
              recommendedContent={recommendedContent}
              seasons={modalSeasonsData}
              customBackground="bg-gradient-to-br from-black via-slate-900 to-violet-900"
            />
          ))}
      </Dialog>

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
