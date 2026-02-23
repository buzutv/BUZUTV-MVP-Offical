import React, { useState, useCallback, useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import { useContent } from "@/hooks/useContent";
import { useChannels } from "@/hooks/useChannels";
import { Play, Info } from "lucide-react";
import "./HeroCarousel.css";
import ContentModal from "./ContentModal";
import FullscreenPlayer from "./FullscreenPlayer";

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
  // Add any other fields needed for modal
}

interface HeroCarouselProps {
  items: HeroCarouselItem[];
  allContent: HeroCarouselItem[];
}

const HeroCarousel: React.FC<HeroCarouselProps> = React.memo(
  ({ items, allContent }) => {
    const { isLoggedIn, setShowLoginModal } = useAuth();
    const { favoriteIds, addToFavorites, removeFromFavorites } =
      useUserFavorites();
    const { content } = useContent();
    const { channels } = useChannels();
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState<"movie" | "series" | null>(null);
    const [modalItem, setModalItem] = useState<HeroCarouselItem | null>(null);
    const [recommendedContent, setRecommendedContent] = useState<
      HeroCarouselItem[]
    >([]);
    const [fullscreenOpen, setFullscreenOpen] = useState(false);
    const [fullscreenUrl, setFullscreenUrl] = useState<string | null>(null);
    const [fullscreenTitle, setFullscreenTitle] = useState<string | null>(null);

    const handlePlay = useCallback((item: HeroCarouselItem) => {
      if (item.type === "series") {
        let videoUrl = "";
        let title = item.title;
        let seasonsData = item.seasons_data;
        if (seasonsData) {
          if (typeof seasonsData === "string") {
            try {
              seasonsData = JSON.parse(seasonsData);
            } catch {}
          }
          if (
            Array.isArray(seasonsData) &&
            seasonsData.length > 0 &&
            seasonsData[0].episodes &&
            seasonsData[0].episodes.length > 0
          ) {
            videoUrl =
              seasonsData[0].episodes[0].videoUrl ||
              seasonsData[0].episodes[0].video_url;
            title = `${item.title} - ${seasonsData[0].episodes[0].title}`;
          }
        }
        if (videoUrl) {
          setFullscreenUrl(videoUrl);
          setFullscreenTitle(title);
          setFullscreenOpen(true);
        }
        return;
      }
      if (!item.videoUrl) return;
      setFullscreenUrl(item.videoUrl);
      setFullscreenTitle(item.title);
      setFullscreenOpen(true);
    }, []);

    const handleMoreInfo = useCallback((item: HeroCarouselItem) => {
      setModalType(item.type || "movie");
      setModalItem(item);
      // Recommendations will be handled internally by ContentModal using useMoreLikeThis hook
      setRecommendedContent([]);
      setModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
      setModalOpen(false);
      setModalItem(null);
      setModalType(null);
      setRecommendedContent([]);
    }, []);

    const handleCloseFullscreen = useCallback(() => {
      setFullscreenOpen(false);
      setFullscreenUrl(null);
      setFullscreenTitle(null);
    }, []);

    const handleSaveItem = useCallback(
      (itemId: string) => {
        if (favoriteIds.includes(itemId)) {
          removeFromFavorites(itemId);
        } else {
          addToFavorites(itemId);
        }
      },
      [favoriteIds, addToFavorites, removeFromFavorites],
    );

    const swiperConfig = useMemo(
      () => ({
        modules: [Navigation, Autoplay],
        slidesPerView: 1.3 as const,
        centeredSlides: true,
        spaceBetween: 30,
        navigation: true,
        autoplay: { delay: 5000, disableOnInteraction: false },
        loop: true,
        breakpoints: {
          640: { slidesPerView: 1.1, spaceBetween: 10 },
          1024: { slidesPerView: 1.3, spaceBetween: 30 },
        },
      }),
      [],
    );

    return (
      <div
        className="w-full relative"
        style={{
          minHeight: "51vh",
          maxHeight: "69vh",
          height: "63vh",
          marginTop: 0,
          paddingTop: 0,
        }}
      >
        <Swiper
          {...swiperConfig}
          className="h-full hero-swiper"
          key={items.length}
        >
          {items.map((slide, idx) => (
            <SwiperSlide key={slide.id || idx}>
              <div className="relative flex items-center justify-center h-[44vh] md:h-[63vh] rounded-3xl overflow-hidden shadow-lg">
                <img
                  src={slide.posterUrl || "/placeholder.svg"}
                  alt={slide.title}
                  loading={idx === 0 ? "eager" : "lazy"}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Dark overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10 z-10" />
                {/* Content overlay, moved further down */}
                <div
                  className="relative z-20 flex flex-col justify-end h-full w-full px-8 md:px-16 lg:px-24"
                  style={{ paddingBottom: "4vh" }}
                >
                  <div className="max-w-xl mb-[6vh] md:mb-[4vh] lg:mb-[3vh]">
                    <h1 className="text-3xl md:text-5xl font-bold mb-4 text-white drop-shadow-lg">
                      {slide.title}
                    </h1>
                    <p className="text-lg md:text-xl text-gray-200 mb-8 drop-shadow-lg">
                      {slide.description}
                    </p>
                    {isLoggedIn ? (
                      <div className="flex gap-4">
                        {/* Only show Play button if not a series */}
                        {slide.type !== "series" && (
                          <button
                            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold text-lg shadow transition-colors min-w-[120px]"
                            onClick={() => handlePlay(slide)}
                            disabled={!slide.videoUrl}
                          >
                            <Play className="w-6 h-6" />
                            Play
                          </button>
                        )}
                        <button
                          className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold text-lg shadow transition-colors"
                          onClick={() => handleMoreInfo(slide)}
                        >
                          <Info className="w-6 h-6" />
                          More Info
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col md:flex-row gap-4 items-center">
                        <button
                          type="button"
                          className="bg-purple-600 hover:bg-purple-700 text-white px-10 py-3 rounded-lg font-semibold text-lg shadow transition-colors min-w-[160px]"
                          onClick={() => {
                            setShowLoginModal(true);
                          }}
                        >
                          Sign Up
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        {/* Navy background for peeks */}
        <div className="absolute inset-0 -z-10 bg-[#0a1026]" />
        {/* Fullscreen Player */}
        {fullscreenOpen && fullscreenUrl && (
          <FullscreenPlayer
            isOpen={fullscreenOpen}
            onClose={handleCloseFullscreen}
            videoUrl={fullscreenUrl}
            title={fullscreenTitle || ""}
          />
        )}
        {/* Modals for More Info */}
        {modalOpen &&
          modalItem &&
          (() => {
            // Find the backend content item and channel
            const backendContentItem = content.find(
              (item) => item.id === modalItem.id,
            );
            const backendChannel = channels.find(
              (ch) => ch.id === modalItem.channelId,
            );

            return (
              <ContentModal
                isOpen={modalOpen}
                onClose={(open) => !open && handleCloseModal()}
                item={modalItem as any}
                variant={modalType || "auto"}
                autoDetectKids={true}
                onPlayEpisode={(url, episodeTitle) => {
                  setFullscreenUrl(url);
                  setFullscreenTitle(episodeTitle);
                  setFullscreenOpen(true);
                }}
                videoUrl={backendContentItem?.video_url || modalItem.videoUrl}
                contentItem={backendContentItem}
                channel={backendChannel}
              />
            );
          })()}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.items.length === nextProps.items.length &&
      prevProps.allContent.length === nextProps.allContent.length
    );
  },
);

HeroCarousel.displayName = "HeroCarousel";

export default HeroCarousel;

