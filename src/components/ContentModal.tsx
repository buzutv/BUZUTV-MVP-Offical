import React, { useState } from "react";
import { Heart, Play, Star } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Movie } from "@/data/mockMovies";
import ContentRow from "@/components/ContentRow";
import BrandButton from "@/components/ui/BrandButton";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import { Content, useContent } from "@/hooks/useContent";
import { Channel, useChannels } from "@/hooks/useChannels";
import { useMoreLikeThis } from "@/hooks/useMoreLikeThis";
import SeriesPlayer from "@/components/SeriesPlayer";

// Type guards to safely access properties
const isMovie = (item: Movie | Content): item is Movie => {
  return "youtubeId" in item;
};

const isContent = (item: Movie | Content): item is Content => {
  return "video_url" in item;
};

// Helper functions to safely access properties from union type
const getIsKids = (item: Movie | Content): boolean => {
  if (isMovie(item)) {
    return item.isKids;
  }
  return item.is_kids ?? false;
};

const getPosterUrl = (item: Movie | Content): string => {
  if (isMovie(item)) {
    return item.posterUrl;
  }
  return item.poster_url || "/placeholder.svg";
};

const getChannelId = (item: Movie | Content): string | undefined => {
  if (isMovie(item)) {
    return item.channelId;
  }
  return item.channel_id || undefined;
};

const getDuration = (item: Movie | Content): number | undefined => {
  if (isMovie(item)) {
    return item.duration;
  }
  return item.duration_minutes || undefined;
};

interface Episode {
  id: string;
  title: string;
  episode_number: number;
  duration_minutes?: number;
  description?: string;
  video_url?: string;
}

interface Season {
  season_number: number;
  episodes: Episode[];
}

export interface ContentModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  item: Movie | Content; // Support both Movie interface and backend content items
  variant?: "movie" | "series" | "auto"; // auto determines from item.type
  isKidsMode?: boolean; // Force kids styling
  autoDetectKids?: boolean; // Auto-detect kids mode from content
  onPlayEpisode?: (videoUrl: string, episodeTitle: string) => void; // Unified play handler
  videoUrl?: string; // Fallback video URL
  contentItem?: Content; // Backend content item
  channel?: Channel; // Channel information
  seasons?: Season[]; // Season data for series
  customBackground?: string; // Custom background styling
  // Deprecated props - kept for backward compatibility but ignored
  isSaved?: boolean;
  onSave?: () => void;
  onPlay?: () => void;
  recommendedContent?: Content[];
  onOpenRelatedItem?: (item: Movie | Content) => void;
  skipContentFiltering?: boolean;
  allowNestedModals?: boolean;
}

const ContentModal: React.FC<ContentModalProps> = ({
  isOpen,
  onClose,
  item,
  variant = "auto",
  isKidsMode,
  autoDetectKids = true,
  onPlayEpisode,
  videoUrl,
  contentItem,
  channel,
  seasons = [],
  customBackground,
  // Backward compatibility - these are ignored
  isSaved,
  onSave,
  onPlay,
  recommendedContent,
  onOpenRelatedItem,
  skipContentFiltering,
  allowNestedModals,
}) => {
  // State for switching items within the modal
  const [currentItem, setCurrentItem] = useState<Movie | Content>(item);

  // SeriesPlayer state
  const [isSeriesPlayerOpen, setIsSeriesPlayerOpen] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [currentSeasonNumber, setCurrentSeasonNumber] = useState<number>(1);

  const { favoriteIds, addToFavorites, removeFromFavorites } =
    useUserFavorites();
  const { content } = useContent();
  const { channels } = useChannels();

  // Always find current backend content item dynamically
  const currentContentItem = React.useMemo(() => {
    return content.find((c) => c.id === currentItem.id);
  }, [currentItem.id, content]);

  // Reset currentItem when item prop changes (new modal opening)
  React.useEffect(() => {
    setCurrentItem(item);
  }, [item]);

  // Dynamic favorite status based on current item
  const isCurrentItemSaved = favoriteIds.includes(currentItem.id);

  // Dynamic save handler for current item
  const handleCurrentItemSave = () => {
    if (isCurrentItemSaved) {
      removeFromFavorites(currentItem.id);
    } else {
      addToFavorites(currentItem.id);
    }
  };

  // Determine if we're in kids mode
  const effectiveKidsMode =
    isKidsMode ??
    (autoDetectKids
      ? getIsKids(currentItem) || currentContentItem?.is_kids
      : false);

  // Get More Like This recommendations using the unified hook
  const { recommendations: moreLikeThisContent } = useMoreLikeThis({
    currentItem,
    contentItem: currentContentItem,
    effectiveKidsMode,
    limit: 6,
  });

  // Determine content type
  const contentType =
    variant === "auto" ? currentItem.type || "movie" : variant;

  // Normalize item to work with both Movie interface and backend items
  const normalizedItem = React.useMemo(
    () => ({
      id: currentItem.id,
      title: currentItem.title,
      posterUrl: getPosterUrl(currentItem),
      type: currentItem.type || "movie",
      genre: currentItem.genre,
      year: currentItem.year,
      rating: currentItem.rating,
      channelId: getChannelId(currentItem),
      isKids: getIsKids(currentItem),
      duration: getDuration(currentItem),
      ...currentItem,
    }),
    [currentItem],
  );

  // Format duration helper
  const formatDuration = (minutes: number | undefined) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  // Get display text for duration/seasons
  const getDurationOrSeasonsText = () => {
    if (contentType === "series") {
      const seasonCount = seasonsData.length;
      if (seasonCount > 0) {
        return seasonCount === 1 ? "1 Season" : `${seasonCount} Seasons`;
      }
      // Fallback: try to get from content item
      if (currentContentItem?.seasons_data) {
        try {
          const seasonsData =
            typeof currentContentItem.seasons_data === "string"
              ? JSON.parse(currentContentItem.seasons_data)
              : currentContentItem.seasons_data;
          if (Array.isArray(seasonsData) && seasonsData.length > 0) {
            const count = seasonsData.length;
            return count === 1 ? "1 Season" : `${count} Seasons`;
          }
        } catch (error) {
          console.error(
            "Error parsing seasons data for duration display:",
            error,
          );
        }
      }
      return "Series";
    } else {
      // For movies, show duration with enhanced fallback logic
      const backendDuration = currentContentItem?.duration_minutes;
      const frontendDuration = normalizedItem.duration;

      // Also try alternative field names that might exist in the data
      const alternativeDuration =
        (currentItem as any)?.duration_minutes ||
        (currentItem as any)?.duration ||
        (currentItem as any)?.runtime;

      const finalDuration =
        backendDuration ?? frontendDuration ?? alternativeDuration;

      if (finalDuration) {
        return formatDuration(finalDuration);
      }

      // If no duration available, return null to hide the display
      return null;
    }
  };

  // Get seasons data for series
  const getSeasonsData = (): Season[] => {
    if (currentContentItem?.seasons_data) {
      try {
        const seasonsData =
          typeof currentContentItem.seasons_data === "string"
            ? JSON.parse(currentContentItem.seasons_data)
            : currentContentItem.seasons_data;

        if (Array.isArray(seasonsData) && seasonsData.length > 0) {
          return seasonsData.map((season) => ({
            season_number: season.seasonNumber,
            episodes: (season.episodes || []).map((episode) => ({
              id:
                episode.id ||
                `ep-${season.seasonNumber}-${episode.episodeNumber}`,
              title: episode.title,
              episode_number: episode.episodeNumber,
              duration_minutes: episode.duration_minutes || 45,
              description: episode.description,
              video_url: episode.videoUrl,
            })),
          }));
        }
      } catch (error) {
        console.error("Error parsing seasons_data:", error);
      }
    }
    return seasons;
  };

  const seasonsData = getSeasonsData();

  // Get current video URL from the current content item
  const currentVideoUrl = React.useMemo(() => {
    return (
      currentContentItem?.video_url ||
      (isMovie(currentItem) ? currentItem.videoUrl : undefined)
    );
  }, [currentContentItem?.video_url, currentItem]);

  // Handle play actions - ALWAYS use current item's data
  const handlePlayMovie = () => {
    if (currentVideoUrl && onPlayEpisode) {
      // Use onPlayEpisode for consistency across all components
      onPlayEpisode(currentVideoUrl, normalizedItem.title);
    } else if (currentVideoUrl) {
      console.warn(
        "No play handler provided, but video URL available:",
        currentVideoUrl,
      );
    } else {
      console.warn(
        "No video URL available for current item:",
        normalizedItem.title,
      );
    }
  };

  const handlePlayFirstEpisode = () => {
    const firstEpisode = seasonsData[0]?.episodes[0];
    if (firstEpisode && seasonsData.length > 0) {
      setCurrentEpisode(firstEpisode);
      setCurrentSeasonNumber(seasonsData[0].season_number);
      setIsSeriesPlayerOpen(true);
    }
  };

  const handlePlayEpisode = (episode: Episode, seasonNumber: number) => {
    if (episode.video_url && seasonsData.length > 0) {
      setCurrentEpisode(episode);
      setCurrentSeasonNumber(seasonNumber);
      setIsSeriesPlayerOpen(true);
    }
  };

  const handleCloseSeriesPlayer = () => {
    setIsSeriesPlayerOpen(false);
    setCurrentEpisode(null);
  };

  // Use the unified More Like This content (already normalized with posterUrl)
  const normalizedRecommendedContent = moreLikeThisContent;

  // Handle More Like This clicks - ALWAYS switch current item within modal
  const handleMoreLikeThisClick = (clickedItem) => {
    setCurrentItem(clickedItem);
  };

  // Background styles
  const getBackgroundStyles = () => {
    if (customBackground) {
      return customBackground;
    }

    if (effectiveKidsMode) {
      return "bg-gradient-to-tl from-yellow-300 via-blue-300 to-sky-400";
    }

    return "";
  };

  const getDefaultBackgroundStyle = () => {
    if (customBackground || effectiveKidsMode) {
      return {};
    }

    return {
      background: `
        linear-gradient(
          200deg,
          #311066 0%,
          #1D0833 20%,
          #120222 45%,
          black 100%
        )`,
    };
  };

  // Gradient styles
  const gradientStyles = effectiveKidsMode
    ? {
        heroGradient:
          "bg-gradient-to-t from-blue-400 via-blue-400/30 to-transparent",
        contentGradient: "bg-gradient-to-b from-blue-400 to-transparent",
        heartBorder: "border-blue-400/50 hover:border-blue-400",
      }
    : {
        heroGradient: "bg-gradient-to-t from-black via-black/60 to-transparent",
        contentGradient: "bg-gradient-to-b from-black to-transparent",
        heartBorder: "border-brand-500/50 hover:border-brand-500",
      };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          onInteractOutside={(e) => {
            if (isSeriesPlayerOpen) {
              e.preventDefault(); // Only block outside clicks when player is open
            }
          }}
          className={`max-w-full md:max-w-[75vw] max-h-full md:max-h-[90vh] text-white border-none p-0 overflow-hidden transition-all duration-1000 ease-in-out opacity-0 scale-95 data-[state=open]:opacity-100 data-[state=open]:scale-100 ${getBackgroundStyles()}`}
          style={getDefaultBackgroundStyle()}
        >
          <DialogTitle className="sr-only">{normalizedItem.title}</DialogTitle>
          <ScrollArea className="h-[90vh] scroll-smooth">
            <div className="relative min-h-full">
              {/* Hero Section */}
              <div className="relative w-full h-[60vh] overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img
                    src={normalizedItem.posterUrl}
                    alt={normalizedItem.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Bottom gradient for fade effect */}
                <div
                  className={`absolute bottom-0 left-0 right-0 h-48 ${gradientStyles.heroGradient}`}
                />

                {/* Title and Info Container */}
                <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
                  <h1
                    className={`text-5xl font-bold text-white mb-6 ${effectiveKidsMode ? "drop-shadow-[2px_2px_4px_rgba(59,130,246,0.8)]" : ""}`}
                  >
                    {normalizedItem.title}
                  </h1>

                  {/* Action Buttons Row */}
                  <div className="flex items-center space-x-4 mb-4">
                    <BrandButton
                      onClick={
                        contentType === "series"
                          ? handlePlayFirstEpisode
                          : handlePlayMovie
                      }
                      disabled={
                        !currentVideoUrl &&
                        (!seasonsData.length ||
                          !seasonsData[0]?.episodes[0]?.video_url)
                      }
                      variant={effectiveKidsMode ? "kids" : "primary"}
                      size="md"
                      className={
                        !currentVideoUrl &&
                        (!seasonsData.length ||
                          !seasonsData[0]?.episodes[0]?.video_url)
                          ? "!bg-gray-600 !text-gray-400 !cursor-not-allowed !hover:bg-gray-600 !hover:-translate-y-0"
                          : ""
                      }
                    >
                      <Play className="w-6 h-6 fill-current" />
                      <span>Play</span>
                    </BrandButton>

                    <button
                      onClick={handleCurrentItemSave}
                      className={`bg-black/20 backdrop-blur-md text-white p-2 rounded-full transition-all duration-200 border ${gradientStyles.heartBorder} hover:bg-black/30`}
                    >
                      <Heart
                        className={`w-5 h-5 ${isCurrentItemSaved ? "fill-current text-red-500" : ""}`}
                      />
                    </button>
                  </div>

                  {/* Info Row */}
                  <div className="flex items-center space-x-4 text-sm h-8">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-green-400 font-semibold">
                        {normalizedItem.rating}
                      </span>
                    </div>
                    <span className="text-white font-medium">
                      {normalizedItem.year}
                    </span>

                    {/* Duration display after year - only show if duration exists */}
                    {getDurationOrSeasonsText() &&
                      (effectiveKidsMode ? (
                        <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                          {getDurationOrSeasonsText()}
                        </span>
                      ) : (
                        <span className="text-white font-medium">
                          {getDurationOrSeasonsText()}
                        </span>
                      ))}

                    {effectiveKidsMode ? (
                      <>
                        <span className="border border-blue-400 px-2 py-0.5 text-xs text-white font-medium bg-blue-500/90">
                          KIDS
                        </span>
                        <span className="bg-yellow-500 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          {normalizedItem.genre}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="border border-brand-500 px-2 py-0.5 text-xs text-gray-300 font-medium">
                          TV-MA
                        </span>
                        <span className="text-white">
                          {normalizedItem.genre}
                        </span>
                      </>
                    )}

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

              {/* Content Section */}
              <div className="p-4 md:p-8 pt-6 pb-0 relative">
                <div
                  className={`absolute top-0 left-0 right-0 h-4 ${gradientStyles.contentGradient} pointer-events-none`}
                />

                {/* Series Episodes Section */}
                {contentType === "series" && seasonsData.length > 0 && (
                  <div className="mb-8">
                    <Tabs defaultValue="season-1" className="w-full">
                      <TabsList
                        className={`grid w-full grid-cols-auto bg-transparent transition-all duration-300 group ${effectiveKidsMode ? "" : ""}`}
                      >
                        {seasonsData.map((season) => (
                          <TabsTrigger
                            key={`season-${season.season_number}`}
                            value={`season-${season.season_number}`}
                            className={
                              effectiveKidsMode
                                ? "transition-all duration-300 hover:scale-105 will-change-transform transform-gpu leading-5 hover:text-white data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-[2px_19px_31px_rgba(59,130,246,0.35)] data-[state=active]:hover:bg-blue-600 hover:bg-blue-500/20"
                                : "transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-105 will-change-transform transform-gpu leading-5 hover:text-white data-[state=active]:bg-[linear-gradient(135deg,#7c3aed,#8b5cf6,#a855f7)] data-[state=active]:text-white data-[state=active]:border-2 data-[state=active]:border-[rgba(139,92,246,0.3)] data-[state=active]:shadow-[0_10px_30px_rgba(139,92,246,0.4)] data-[state=active]:hover:shadow-[0_20px_50px_rgba(139,92,246,0.6)] data-[state=active]:hover:brightness-110 data-[state=active]:hover:-translate-y-0.5 data-[state=active]:relative data-[state=active]:overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] before:transition-[left] before:duration-500 data-[state=active]:hover:before:left-full"
                            }
                          >
                            Season {season.season_number}
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {seasonsData.map((season) => (
                        <TabsContent
                          key={`season-${season.season_number}`}
                          value={`season-${season.season_number}`}
                          className="space-y-2"
                        >
                          {season.episodes.map((episode) => (
                            <div
                              key={episode.id}
                              onClick={() =>
                                handlePlayEpisode(episode, season.season_number)
                              }
                              className={`border flex items-center space-x-3 rounded-lg p-3 transition-all duration-300 group h-12 cursor-pointer ${
                                effectiveKidsMode
                                  ? "border-blue-400/20 bg-blue-500/60 hover:border-white hover:shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                                  : "border-brand-500/20 bg-black hover:border-white hover:shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                              }`}
                            >
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <span className="text-white font-medium text-sm">
                                  {episode.episode_number}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-white font-medium text-sm line-clamp-1">
                                    {episode.title}
                                  </h3>
                                </div>
                                <span className="text-gray-300 text-xs flex-shrink-0">
                                  {formatDuration(episode.duration_minutes)}
                                </span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlayEpisode(
                                    episode,
                                    season.season_number,
                                  );
                                }}
                                className="ml-3 p-2 rounded-full transition-colors bg-white/10 hover:bg-white/20 text-white flex-shrink-0"
                                aria-label={`Play ${episode.title}`}
                              >
                                <Play className="w-4 h-4 fill-current" />
                              </button>
                            </div>
                          ))}
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>
                )}

                {/* More Like This Section */}
                {normalizedRecommendedContent.length > 0 && (
                  <ContentRow
                    title="More Like This"
                    items={normalizedRecommendedContent}
                    isMoreLikeThis={true}
                    onItemClick={handleMoreLikeThisClick}
                  />
                )}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* SeriesPlayer for series content */}
      {isSeriesPlayerOpen && currentEpisode && (
        <SeriesPlayer
          isOpen={isSeriesPlayerOpen}
          onClose={handleCloseSeriesPlayer}
          seriesTitle={normalizedItem.title}
          seasons={seasonsData}
          currentEpisode={currentEpisode}
          currentSeason={currentSeasonNumber}
        />
      )}
    </>
  );
};

export default ContentModal;
