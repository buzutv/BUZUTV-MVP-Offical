import React, { useCallback, useMemo, useState } from "react";
import { Play } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Movie } from "@/data/mockMovies";
import { useAuth } from "@/contexts/AuthContext";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import { useContent } from "@/hooks/useContent";
import { useChannels } from "@/hooks/useChannels";
import ContentModal from "@/components/ContentModal";
import FullscreenPlayer from "@/components/FullscreenPlayer";

export interface ContentCardProps {
  item: Movie | any; // Support both Movie interface and backend content items
  variant?: "movie" | "series" | "auto"; // auto determines from item.type
  isKidsMode?: boolean; // Force kids styling regardless of location
  autoDetectKids?: boolean; // Auto-detect kids mode from location
  showSaveButton?: boolean;
  showProgress?: boolean;
  progressPercent?: number;
  showResumeButton?: boolean;
  onPlayFullscreen?: (videoUrl: string) => void;
  onOpen?: () => boolean;
  onItemClick?: (item: Movie | any) => void; // For MoreLikeThis behavior
  className?: string;
  // MoreLikeThisCard specific props
  isMoreLikeThis?: boolean;
  width?: string; // Default: auto, MoreLikeThis: w-64
}

const ContentCard = React.memo(
  ({
    item,
    variant = "auto",
    isKidsMode,
    autoDetectKids = true,
    showSaveButton = true,
    showProgress = false,
    progressPercent = 0,
    showResumeButton = false,
    onPlayFullscreen,
    onOpen,
    onItemClick,
    className = "",
    isMoreLikeThis = false,
    width = "auto",
  }: ContentCardProps) => {
    const location = useLocation();
    const { isLoggedIn, setShowLoginModal } = useAuth();
    const { favoriteIds, addToFavorites, removeFromFavorites } = useUserFavorites();
    const { content } = useContent();
    const { channels } = useChannels();

    const [currentModalItem, setCurrentModalItem] = useState<Movie | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [currentVideoUrl, setCurrentVideoUrl] = useState("");
    const [currentVideoTitle, setCurrentVideoTitle] = useState("");

    // Determine if we're in kids mode
    const effectiveKidsMode = isKidsMode ?? (autoDetectKids ? location.pathname === "/kids" : false);
    
    // Determine content type
    const contentType = variant === "auto" ? item.type || "movie" : variant;
    
    // Normalize item to work with both Movie interface and backend items
    const normalizedItem = useMemo(() => ({
      id: item.id,
      title: item.title,
      posterUrl: item.posterUrl || item.poster_url || "/placeholder.svg",
      type: item.type || "movie",
      genre: item.genre,
      year: item.year,
      rating: item.rating,
      channelId: item.channelId || item.channel_id,
      isKids: item.isKids || item.is_kids,
      ...item, // Keep all other properties
    }), [item]);

    const actualItem = currentModalItem || normalizedItem;

    const isSaved = useMemo(
      () => favoriteIds.includes(actualItem.id),
      [favoriteIds, actualItem.id]
    );

    const contentItem = useMemo(
      () => content.find((c) => c.id === actualItem.id),
      [content, actualItem.id]
    );

    const videoUrl = contentItem?.video_url;
    
    const channel = useMemo(
      () => channels.find((ch) => ch.id === actualItem.channelId),
      [channels, actualItem.channelId]
    );

    const handleSave = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isSaved) {
          removeFromFavorites(actualItem.id);
        } else {
          addToFavorites(actualItem.id);
        }
      },
      [isSaved, actualItem.id, addToFavorites, removeFromFavorites]
    );

    const handleCardClick = useCallback(() => {
      if (onOpen && onOpen() === true) return;
      
      if (onItemClick) {
        onItemClick(actualItem);
        return;
      }
      
      // If user is not logged in, show login modal instead of content modal
      if (!isLoggedIn) {
        setShowLoginModal(true);
        return;
      }
      
      setCurrentModalItem(actualItem);
    }, [onOpen, onItemClick, actualItem, isLoggedIn, setShowLoginModal]);

    const handleModalPlayClick = useCallback(() => {
      if (contentItem?.video_url) {
        if (onPlayFullscreen) {
          onPlayFullscreen(contentItem.video_url);
          setCurrentModalItem(null);
        } else {
          setCurrentModalItem(null);
          setTimeout(() => {
            setCurrentVideoUrl(contentItem.video_url);
            setCurrentVideoTitle(actualItem.title);
            setIsFullscreen(true);
          }, 200);
        }
      }
    }, [contentItem?.video_url, onPlayFullscreen, actualItem.title]);

    const handlePlayEpisode = useCallback((videoUrl: string, episodeTitle: string) => {
      if (onPlayFullscreen) {
        onPlayFullscreen(videoUrl);
        setCurrentModalItem(null);
      } else {
        setCurrentModalItem(null);
        setTimeout(() => {
          setCurrentVideoUrl(videoUrl);
          setCurrentVideoTitle(episodeTitle);
          setIsFullscreen(true);
        }, 200);
      }
    }, [onPlayFullscreen]);

    const handleExitFullscreen = useCallback(() => {
      setIsFullscreen(false);
      setCurrentVideoUrl("");
      setCurrentVideoTitle("");
    }, []);

    const handleSaveModal = useCallback(() => {
      if (isSaved) {
        removeFromFavorites(actualItem.id);
      } else {
        addToFavorites(actualItem.id);
      }
    }, [isSaved, actualItem.id, addToFavorites, removeFromFavorites]);

    const recommendedContent = useMemo(
      () =>
        content
          .filter(
            (c) =>
              c.id !== actualItem.id &&
              (c.genre === actualItem.genre || c.channel_id === actualItem.channelId)
          )
          .slice(0, 6),
      [content, actualItem.id, actualItem.genre, actualItem.channelId]
    );

    // Gradient classes based on kids mode
    const gradientClasses = effectiveKidsMode
      ? {
          base: "bg-[linear-gradient(to_top,_rgba(37,99,235,0.95)_0%,_rgba(37,99,235,0.7)_30%,_rgba(37,99,235,0.4)_60%,_rgba(37,99,235,0.2)_80%,_rgba(37,99,235,0.1)_90%,_transparent_100%)]",
          hover: "bg-[linear-gradient(to_top,_rgba(37,99,235,0.95)_0%,_rgba(37,99,235,0.7)_30%,_rgba(37,99,235,0.4)_60%,_transparent_90%)]",
        }
      : {
          base: "bg-[linear-gradient(to_top,_rgba(0,0,0,0.95)_0%,_rgba(0,0,0,0.7)_30%,_rgba(0,0,0,0.4)_60%,_rgba(0,0,0,0.2)_80%,_rgba(0,0,0,0.1)_90%,_transparent_100%)]",
          hover: "bg-[linear-gradient(to_top,_rgba(0,0,0,0.95)_0%,_rgba(0,0,0,0.7)_30%,_rgba(0,0,0,0.4)_60%,_transparent_90%)]",
        };

    // Width classes
    const widthClass = isMoreLikeThis ? "w-64 flex-shrink-0" : width === "auto" ? "" : width;

    return (
      <>
        {isFullscreen && currentVideoUrl && (
          <FullscreenPlayer
            isOpen={isFullscreen}
            onClose={handleExitFullscreen}
            videoUrl={currentVideoUrl}
            title={currentVideoTitle}
          />
        )}

        <div
          className={`content-card group ${widthClass} border-2 border-transparent hover:scale-105 hover:border-white hover:shadow-[0_0_4px_rgba(255,255,255,0.6)] focus:scale-105 focus:border-white focus:shadow-[0_0_4px_rgba(255,255,255,0.6)] focus:outline-none rounded-lg transition-all duration-300 overflow-hidden ${className}`}
          tabIndex={0}
          role="button"
          aria-label={`${normalizedItem.type === 'series' ? 'View series' : 'View movie'} ${normalizedItem.title}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleCardClick();
            }
          }}
        >
          <div className="block cursor-pointer" onClick={handleCardClick}>
            <div
              className="relative overflow-hidden transition-all duration-300 aspect-[2/3] sm:aspect-video"
            >
              <div className="w-full h-full">
                <img
                  src={normalizedItem.posterUrl}
                  alt={`${normalizedItem.title} - ${normalizedItem.type === 'series' ? 'TV Series' : 'Movie'} poster`}
                  className="w-full h-full rounded-lg object-cover transform transition-transform duration-300 hover:scale-[1.1]"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              {showProgress && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600">
                  <div
                    className="h-full bg-red-600 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}

              <div className="absolute inset-0 z-0 rounded-lg pointer-events-none">
                <div className={`absolute bottom-[-1px] left-0 right-0 h-1/2 ${gradientClasses.base}`} />
                <div
                  className={`absolute bottom-[-1px] left-0 right-0 h-1/2 ${gradientClasses.hover} opacity-0 group-hover:opacity-50 transition-opacity duration-300`}
                />
              </div>

              <div className="absolute bottom-0 left-0 right-0 z-10 p-3 pt-6 pointer-events-none">
                <h3 className="font-medium text-white text-md line-clamp-2 transform transition-transform duration-300 origin-left group-hover:scale-[1.1]">
                  {normalizedItem.title}
                </h3>
              </div>

              {showResumeButton && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <button className="bg-white text-black px-4 py-2 rounded-lg font-semibold flex items-center space-x-2">
                    <Play className="w-4 h-4" />
                    <span>Resume</span>
                  </button>
                </div>
              )}

              {isMoreLikeThis && (
                <button 
                  className="absolute inset-0 z-20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black" 
                  onClick={handleCardClick}
                  aria-label={`View ${normalizedItem.title} details`}
                />
              )}
            </div>
          </div>
        </div>

        {/* Unified Modal Rendering */}
        {currentModalItem && !isFullscreen && (
          <ContentModal
            isOpen={true}
            onClose={(open) => !open && setCurrentModalItem(null)}
            item={actualItem}
            variant={contentType}
            isKidsMode={effectiveKidsMode}
            autoDetectKids={false} // We already determined the mode
            isSaved={isSaved}
            onSave={handleSaveModal}
            onPlayEpisode={handlePlayEpisode}
            videoUrl={videoUrl}
            contentItem={contentItem}
            channel={channel}
            recommendedContent={recommendedContent}
            onOpenRelatedItem={setCurrentModalItem}
            skipContentFiltering={isMoreLikeThis}
            allowNestedModals={effectiveKidsMode}
          />
        )}
      </>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.showProgress === nextProps.showProgress &&
      prevProps.progressPercent === nextProps.progressPercent &&
      prevProps.showResumeButton === nextProps.showResumeButton &&
      prevProps.isKidsMode === nextProps.isKidsMode &&
      prevProps.variant === nextProps.variant
    );
  }
);

ContentCard.displayName = "ContentCard";

export default ContentCard;