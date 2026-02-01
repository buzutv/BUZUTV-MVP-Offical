import React, { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "./HeroCarousel.css";
import { useAuth } from "@/contexts/AuthContext";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import { useContent } from "@/hooks/useContent";
import { useChannels } from "@/hooks/useChannels";
import { ArrowLeft, ArrowRight, Info, Play } from "lucide-react";
import ContentModal from "./ContentModal";
import ChannelCard from "./ChannelCard";
import BrandButton from "./ui/BrandButton";
import { Channel } from "@/data/mockMovies";
import { useDispatch } from "react-redux";
import { useLazyGetSeasonWithEpisodesQuery } from "@/store/seasonSlice";


export interface HeroCarouselItem {
  id: string;
  title: string;
  description: string | null;
  posterUrl?: string | null;
  videoUrl?: string | null;
  type?: "movie" | "series";
  genre?: string;
  year?: number;
  rating?: number;
  channelId?: string;
  seasons_data?: any;
  isKids?: boolean;
}

interface FullViewportHeroProps {
  items: HeroCarouselItem[];
  allContent: HeroCarouselItem[];
  channels: Channel[];
  onChannelClick: (channel: any) => void;
}

const FullViewportHero: React.FC<FullViewportHeroProps> = ({
  items,
  allContent,
  channels,
  onChannelClick,
}) => {
  const { isLoggedIn, user, setShowLoginModal } = useAuth();
  const dispatch = useDispatch();
  const { favoriteIds, addToFavorites, removeFromFavorites } =
    useUserFavorites();
  const { content, refetch: refetchContent } = useContent();
  const { channels: backendChannels } = useChannels();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"movie" | "series" | null>(null);
  const [modalItem, setModalItem] = useState<HeroCarouselItem | null>(null);
  const [recommendedContent, setRecommendedContent] = useState<
    HeroCarouselItem[]
  >([]);
  const [triggerSeasonWithEpisodesandWatchHistory] = useLazyGetSeasonWithEpisodesQuery()

  // Play button now opens ContentModal (user requirement)
  const handlePlay = async (item: HeroCarouselItem) => {
    setModalType(item.type || "movie");
    setModalItem(item);
    setRecommendedContent([]);
    setModalOpen(true);
  };

  // Open modal for more info
  const handleMoreInfo = (item: HeroCarouselItem) => {
    setModalType(item.type || "movie");
    setModalItem(item);
    // Recommendations will be handled internally by ContentModal using useMoreLikeThis hook
    setRecommendedContent([]);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setModalItem(null);
    setModalType(null);
    setRecommendedContent([]);
    refetchContent();
  };


  // Handle save/unsave for favorites
  const handleSaveItem = (itemId: string) => {
    if (favoriteIds.includes(itemId)) {
      removeFromFavorites(itemId);
    } else {
      addToFavorites(itemId);
    }
  };

  // Channel scroll functions
  const scrollChannelsLeft = () => {
    const container = document.getElementById("channels-container");
    if (container) {
      container.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  const scrollChannelsRight = () => {
    const container = document.getElementById("channels-container");
    if (container) {
      container.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Main Hero Carousel */}
      <div className="absolute inset-0">
        <Swiper
          modules={[Navigation, Autoplay, Pagination]}
          slidesPerView={1}
          navigation={{
            prevEl: ".hero-prev",
            nextEl: ".hero-next",
          }}
          pagination={{
            clickable: true,
            bulletClass: "swiper-pagination-bullet-hero",
            bulletActiveClass: "swiper-pagination-bullet-hero-active",
          }}
          autoplay={{ delay: 6000, disableOnInteraction: false }}
          loop={true}
          className="h-full w-full"
        >
          {items.map((slide, idx) => (
            <SwiperSlide key={slide.id || idx}>
              <div className="relative w-full h-full">
                {/* Background Image */}
                <div
                  className="absolute inset-0 w-full h-full bg-no-repeat bg-cover hero-bg-mobile md:bg-cover hero-slide"
                  style={{
                    backgroundImage: `url(${slide.posterUrl || "/placeholder.svg"})`,
                  }}
                />

                {/* Gradient Overlays */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/70 to-transparent h-[70%]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent md:hidden" />

                {/* Content */}
                <div className="relative bottom-[4rem] z-10 flex flex-col h-full px-4 md:px-16 lg:px-24_max-w-4xl pb-48">
                  <div className="space-y-4 md:space-y-6 mt-auto md: pb-8">
                    {/* Movie Title */}
                    <h1 className="text-3xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
                      {slide.title}
                    </h1>

                    {/* Info Row */}
                    <div className="flex items-center space-x-3 mb-6">
                      {slide.genre && (
                        <span className="bg-brand-500/70 text-white px-2 py-1 rounded text-sm">
                          {slide.genre}
                        </span>
                      )}
                      {slide.year && (
                        <span className="text-white text-sm">
                          {slide.year}
                        </span>
                      )}
                      {/* Duration/Seasons - only show if available */}
                      {(() => {
                        const currentContentItem = content.find((c) => c.id === slide.id);

                        if (slide.type === "series") {
                          // For series, show number of seasons - using same logic as ContentModal
                          if (currentContentItem?.seasons_data) {
                            try {
                              const seasonsData =
                                typeof currentContentItem.seasons_data === "string"
                                  ? JSON.parse(currentContentItem.seasons_data)
                                  : currentContentItem.seasons_data;

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
                          const duration = currentContentItem?.duration_minutes;

                          if (duration) {
                            const hours = Math.floor(duration / 60);
                            const mins = duration % 60;
                            const formattedDuration = hours > 0
                              ? (mins > 0 ? `${hours}h ${mins}m` : `${hours}h`)
                              : `${mins}m`;

                            return (
                              <span className="text-white text-sm">
                                {formattedDuration}
                              </span>
                            );
                          }
                        }

                        return null;
                      })()}
                      {/* Rating - always display like HeroBanner */}
                      <div className="flex items-center space-x-1">
                        <span className="text-yellow-400">★</span>
                        <span className="text-white text-sm">
                          {slide.rating || 0}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    {slide.description && (
                      <p className="text-base md:text-xl text-gray-200 max-w-2xl leading-relaxed line-clamp-3 md:line-clamp-none">
                        {slide.description}
                      </p>
                    )}

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      {isLoggedIn ? (
                        <>
                          <BrandButton
                            variant="primary"
                            onClick={() => handlePlay(slide)}
                            disabled={
                              !slide.videoUrl && slide.type !== "series" && !content.find(c => c.id === slide.id)?.video_url
                            }
                          >
                            <Play className="w-fit h-6 fill-current" />
                            Play
                          </BrandButton>

                          <BrandButton
                            variant="secondary"
                            onClick={() => handleMoreInfo(slide)}
                          >
                            <Info className="w-fit h-6" />
                            Info
                          </BrandButton>
                        </>
                      ) : (
                        <BrandButton
                          variant="primary"
                          onClick={() => setShowLoginModal(true)}
                        >
                          Sign Up
                        </BrandButton>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Bottom Gradient Transition */}
        <div className="absolute bottom-0 left-0 right-0 z-15 h-32 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent pointer-events-none" />
      </div>

      {/* Bottom Channels Section */}
      <div className="absolute -bottom-4 left-0 right-0 z-10 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
        <div className="px-8 pt-4">
          {/* Channels Header */}
          <div className="mb-4">
            <h2 className="text-white text-xl md:text-2xl">Top Channels</h2>
          </div>


          {/* Channels Scrollable Row with Side Navigation */}
          <div className="relative">
            {/* Left Arrow */}
            <button
              onClick={scrollChannelsLeft}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-30 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 backdrop-blur-sm"
              style={{ marginLeft: "-20px" }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Right Arrow */}
            <button
              onClick={scrollChannelsRight}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-30 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 backdrop-blur-sm"
              style={{ marginRight: "-20px" }}
            >
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Channels Container */}
            <div
              id="channels-container"
              className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className="flex-shrink-0 w-58 md:w-48 lg:w-52"
                >
                  <div onClick={() => onChannelClick(channel)}>
                    <ChannelCard channel={channel} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>


      {/* Modals */}
      {modalOpen && modalItem && (() => {
        // Find the backend content item and channel
        const backendContentItem = content.find(item => item.id === modalItem.id);
        const backendChannel = backendChannels.find(ch => ch.id === modalItem.channelId);

        return (
          <ContentModal
            isOpen={modalOpen}
            onClose={(open) => !open && handleCloseModal()}
            item={modalItem as any}
            variant={modalType || "auto"}
            autoDetectKids={true}
            onPlayEpisode={(url, episodeTitle) => {
              // Internal to ContentModal now
            }}
            videoUrl={backendContentItem?.video_url || modalItem.videoUrl}
            movieId={modalItem.id}
            contentItem={backendContentItem as any}
            channel={backendChannel}
          />
        );
      })()}

      {/* Custom Pagination Styles */}
      <style>{`
        .swiper-pagination-bullet-hero {
          width: 12px;
          height: 12px;
          background: rgba(255, 255, 255, 0.5);
          opacity: 1;
          margin: 0 6px;
          transition: all 0.3s ease;
        }

        .swiper-pagination-bullet-hero-active {
          background: white;
          transform: scale(1.2);
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .hero-bg-mobile {
          background-position: center 20%;
          background-size: cover;
        }

        @media (max-width: 768px) {
          .hero-bg-mobile {
            background-position: center 20%;
            background-size: contain;
            background-repeat: no-repeat;
          }
        }
      `}</style>
    </div>
  );
};

export default FullViewportHero;
