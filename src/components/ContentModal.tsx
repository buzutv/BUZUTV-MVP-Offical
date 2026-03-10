import React, { useEffect, useMemo, useState, useCallback } from "react";
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
import { fetchSeriesSeasons, getOptimizedImageUrl } from "@/utils/youtubeUtils";
import FullscreenPlayer from "./FullscreenPlayer";
import {
  useGetSeasonWithEpisodesQuery,
  useLazyGetSeasonWithEpisodesQuery,
} from "@/store/seasonSlice";
import {
  openScreenPlayer,
  closeScreenPlayer,
  setContentId,
  setisSeries,
  setSeriesData,
  setShowAd,
} from "@/store/screenPlayerSlice";
import { useDispatch, useSelector } from "react-redux";
import { useLazyGetPlaylistContentWithWatchHistoryQuery } from "@/store/contentSlice";
import { useAuth } from "@/contexts/AuthContext";
import MovieDetailSection from "./MovieDetailSection";


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
  movieId: string;
  // Deprecated props - kept for backward compatibility but ignored
  isSaved?: boolean;
  onSave?: () => void;
  onPlay?: () => void;
  recommendedContent?: Content[];
  onOpenRelatedItem?: (item: Movie | Content) => void;
  skipContentFiltering?: boolean;
  allowNestedModals?: boolean;
  startInPlayerMode?: boolean;
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
  movieId,
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
  startInPlayerMode,
}) => {
  // State for switching items within the modal
  const [currentItem, setCurrentItem] = useState<Movie | Content>(item);

  const contentModalOpen = useSelector(
    (state: any) => state.screenPlayer.contentModalOpen,
  );
  // SeriesPlayer state
  const [isSeriesPlayerOpen, setIsSeriesPlayerOpen] = useState(false);
  const [isMovieOpen, setIsMovieOpen] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [currentSeasonNumber, setCurrentSeasonNumber] = useState<number>(1);
  const showAd = useSelector((state: any) => state.screenPlayer.showAd);
  // const { user } = useAuth();
  const [triggerGetContentWithWatchHistory, result] =
    useLazyGetPlaylistContentWithWatchHistoryQuery();
  // const USER_ID = user?.id;
  const dispatch = useDispatch();
  const { favoriteIds, addToFavorites, removeFromFavorites } =
    useUserFavorites();
  const [movie, setMovie] = useState(movieId);

  useEffect(() => {
    if (movieId) {
      setMovie(movieId);
    }
  }, [movieId]);

  const { content } = useContent();
  const { channels } = useChannels();
  const [seasonWithEpisodes, setSeasonWithEpisodes] = useState([]);
  const playlistId = useSelector((state: any) => state.screenPlayer.playlistId);
  const selectedFromRecommendations = useSelector(
    (state: any) => state.screenPlayer.selectedVideo,
  );

  // Carousel Ref
  const cwScrollRef = React.useRef<HTMLDivElement>(null);

  const scrollCW = (direction: "left" | "right") => {
    if (cwScrollRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      cwScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Determine content type early so it can be used in hooks
  const contentType = useMemo(() => {
    return variant === "auto" ? currentItem.type || "movie" : variant;
  }, [variant, currentItem.type]);
  useEffect(() => {
    if (isOpen) {
      dispatch(setShowAd(true));
      const timer = setTimeout(() => dispatch(setShowAd(false)), 8000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    if (isMovieOpen || isSeriesPlayerOpen) {
      dispatch(setShowAd(false));
    }
  }, [isMovieOpen, isSeriesPlayerOpen, dispatch]);

  // Normalize item early
  const normalizedItem = useMemo(
    () => ({
      id: currentItem?.id,
      title: currentItem?.title,
      posterUrl: getPosterUrl(currentItem),
      type: currentItem?.type || "movie",
      genre: currentItem?.genre,
      year: currentItem?.year,
      rating: currentItem?.rating,
      channelId: getChannelId(currentItem),
      isKids: getIsKids(currentItem),
      duration: getDuration(currentItem),
      ...currentItem,
    }),
    [currentItem],
  );

  //console.log("Content Modal item", currentItem);

  const [triggerSeasonWithEpisode] = useLazyGetSeasonWithEpisodesQuery();
  // console.log("Season with Episode", seasonWithEpisode)
  const isSeries = useSelector((state: any) => state.screenPlayer.isSeries);
  const { user, isLoggedIn, setShowLoginModal } = useAuth();

  const requireAuthToPlay = useCallback(() => {
    if (isLoggedIn) return true;
    setShowLoginModal(true);
    return false;
  }, [isLoggedIn, setShowLoginModal]);

  const continueWatchingEpisodes = useMemo(() => {
    if (
      contentType !== "series" ||
      !seasonWithEpisodes ||
      seasonWithEpisodes.length === 0
    )
      return [];

    // Flatten all episodes with their season number and global index
    let currentGlobalIdx = 0;
    const allEpisodesWithInfo = seasonWithEpisodes.flatMap((s) => {
      const episodesWithIdx = (s.episodes || []).map((ep, idx) => ({
        ...ep,
        seasonNumber: s.season_number,
        withinSeasonIndex: idx,
        globalIndex: currentGlobalIdx + idx,
        actualSeasonData: s,
      }));
      currentGlobalIdx += (s.episodes || []).length;
      return episodesWithIdx;
    });

    // 1. Find episodes currently "In Progress" (started but not completed)
    const inProgress = allEpisodesWithInfo.filter(
      (ep) => ((ep.watch_percentage ?? 0) > 0 || (ep.last_position ?? 0) > 0 || !!ep.watched_at) && !ep.completed
    );

    // If we have in-progress episodes, return all of them sorted by recency
    if (inProgress.length > 0) {
      return inProgress.sort((a, b) => {
        const dateA = a.watched_at ? new Date(a.watched_at).getTime() : 0;
        const dateB = b.watched_at ? new Date(b.watched_at).getTime() : 0;
        return dateB - dateA; // Newest first
      });
    }

    // 2. If no in-progress, find the last completed episode and suggest the next one
    const completedEpisodes = allEpisodesWithInfo.filter(ep => ep.completed)
      .sort((a, b) => {
        const dateA = a.watched_at ? new Date(a.watched_at).getTime() : 0;
        const dateB = b.watched_at ? new Date(b.watched_at).getTime() : 0;
        return dateB - dateA;
      });

    if (completedEpisodes.length > 0) {
      const lastCompleted = completedEpisodes[0];
      const nextEpisodeIdx = lastCompleted.globalIndex + 1;

      if (nextEpisodeIdx < allEpisodesWithInfo.length) {
        return [allEpisodesWithInfo[nextEpisodeIdx]];
      }

      // If we finished the last episode, maybe show it again or show nothing?
      // Usually platforms show the last watched or nothing. Let's return the last completed if none next.
      return [lastCompleted];
    }

    // 3. Fallback: If no history at all, show the very first episode
    if (allEpisodesWithInfo.length > 0) {
      return [allEpisodesWithInfo[0]];
    }

    return [];
  }, [contentType, seasonWithEpisodes]);

  // Consolidate season data fetching
  useEffect(() => {
    async function fetchSeasonData() {
      const activeId = (currentItem as any)?.originalId || movie || currentItem?.id;
      if (!activeId || !user?.id) return;

      const isSeriesType = currentItem.type === "series" || (currentItem as any).variant === "series";

      if (isSeriesType) {
        try {
          const data = await triggerSeasonWithEpisode({
            contentId: activeId,
            userId: user.id
          }).unwrap();
          setSeasonWithEpisodes(data);
        } catch (err) {
          console.error("Error fetching season data in ContentModal:", err);
        }
      }
    }

    fetchSeasonData();
  }, [movie, user?.id, contentModalOpen, currentItem.id]);
  // useEffect(() => {
  //   // Add a check to ensure data exists
  //   if (seasonWithEpisodes && seasonWithEpisodes.length > 0) {
  //     dispatch(setSeriesData({
  //       isSeries: true,
  //       seriesData: seasonWithEpisodes[0]
  //     }));
  //   }
  // }, [seasonWithEpisodes, dispatch])
  // console.log("Fetched season with episodes:", seasonWithEpisodes);
  // Always find current backend content item dynamically
  const currentContentItem = useMemo(() => {
    return content.find((c) => c.id === ((currentItem as any).originalId || currentItem.id));
  }, [currentItem.id, (currentItem as any).originalId, content]);

  // Reset currentItem when item prop changes (new modal opening)
  useEffect(() => {
    setCurrentItem(item);
  }, [item]);

  //console.log("Seasons passed to ContentModal:", seasons);
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

  //console.log("More Like This Content:", currentContentItem);

  // Handle startInPlayerMode
  useEffect(() => {
    if (isOpen && startInPlayerMode) {
      if (contentType === "series") {
        if (seasonWithEpisodes.length > 0) {
          handlePlayFirstEpisode();
        }
      } else {
        handlePlayMovie();
      }
    }
  }, [
    isOpen,
    startInPlayerMode,
    contentType,
    seasonWithEpisodes.length,
    requireAuthToPlay,
  ]);

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
      const seasonCount = seasons.length;
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
  //console.log("Seasons Data in ContentModal:", currentContentItem);
  // Get current video URL from the current content item
  const currentVideoUrl = useMemo(() => {
    return (
      currentContentItem?.video_url ||
      (isMovie(currentItem)
        ? currentItem.videoUrl || currentItem.video_url
        : undefined)
    );
  }, [currentContentItem?.video_url, currentItem]);

  // Handle play actions - ALWAYS use current item's data
  const handlePlayMovie = () => {
    if (!requireAuthToPlay()) return;

    if (currentVideoUrl && onPlayEpisode) {
      // Use onPlayEpisode for consistency across all components
      dispatch(
        openScreenPlayer({
          isOpen: true,
          selectedVideo:
            selectedFromRecommendations || currentContentItem || currentItem,
          selectedVideoTitle: normalizedItem.title,
          videoUrl: currentVideoUrl,
          contentId: normalizedItem.id,
          poster_url:
            currentContentItem?.poster_url || normalizedItem.posterUrl,
        }),
      );
      setIsMovieOpen(true);
      dispatch(setShowAd(true));

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

  const hasNext = (): boolean => {
    return !!(seasonWithEpisodes && currentEpisode
      ? seasonWithEpisodes.some((season) =>
        season.episodes.some(
          (episode) =>
            episode.season_number > currentSeasonNumber ||
            (episode.season_number === currentSeasonNumber &&
              episode.episode_number > currentEpisode.episode_number),
        ),
      )
      : false);
  };

  const handlePlayFirstEpisode = () => {
    if (!requireAuthToPlay()) return;

    const firstSeason = seasonWithEpisodes[0];
    const firstEpisode = firstSeason?.episodes[0];

    if (firstEpisode && firstSeason) {
      dispatch(
        openScreenPlayer({
          isOpen: true,
          isSeries: true,
          selectedVideo: firstEpisode,
          currentVideoIndex: 0,
          seriesData: seasonWithEpisodes,
          contentId: (currentItem as any).originalId || currentItem.id,
          poster_url:
            currentContentItem?.poster_url || normalizedItem.posterUrl,
        }),
      );

      setCurrentEpisode(firstEpisode);
      setCurrentSeasonNumber(firstSeason.season_number);
      setIsSeriesPlayerOpen(true);
      dispatch(setShowAd(true));
    }
  };

  const handleResumeSeries = () => {
    if (!requireAuthToPlay()) return;

    if (continueWatchingEpisodes.length > 0) {
      const episode = continueWatchingEpisodes[0];
      handlePlayEpisode(
        episode,
        episode.seasonNumber,
        episode.withinSeasonIndex,
        episode.actualSeasonData,
      );
    } else {
      handlePlayFirstEpisode();
    }
  };

  const handlePlayEpisode = (
    episode: Episode,
    seasonNumber: number,
    index: number,
    seasonData: any,
  ) => {
    if (!requireAuthToPlay()) return;

    const epVideoUrl = episode.video_url || (episode as any).videoUrl;
    //console.log("Play episode clicked:", {
    // episodeId: episode.id,
    // videoUrl: epVideoUrl,
    // seasonNumber,
    //index,
    //});

    if (epVideoUrl && seasonWithEpisodes.length > 0) {
      // Calculate global index across all seasons for correct autoplay
      let globalIndex = 0;
      for (const season of seasonWithEpisodes) {
        if (season.season_number < seasonNumber) {
          globalIndex += season.episodes?.length || 0;
        } else if (season.season_number === seasonNumber) {
          globalIndex += index;
          break;
        }
      }

      // console.log("Global index calculated:", globalIndex);

      dispatch(
        openScreenPlayer({
          isOpen: true,
          isSeries: true,
          selectedVideo: { ...episode, video_url: epVideoUrl }, // Ensure video_url exists for consumer
          currentVideoIndex: globalIndex,
          seriesData: seasonWithEpisodes,
          contentId: currentItem.id, // Store ID only for consistency
          poster_url:
            currentContentItem?.poster_url || normalizedItem.posterUrl,
        }),
      );

      // Update local state to trigger FullscreenPlayer early return
      setCurrentEpisode({ ...episode, video_url: epVideoUrl });
      setCurrentSeasonNumber(seasonNumber);
      setIsSeriesPlayerOpen(true);
      dispatch(setShowAd(true));
    } else {
      console.warn(
        "Cannot play episode: video URL missing or seasons not loaded",
        { episode, hasSeasons: seasonWithEpisodes.length > 0 },
      );
    }
  };

  const handleCloseSeriesPlayer = async () => {
    setIsSeriesPlayerOpen(false);
    setCurrentEpisode(null);
    setIsMovieOpen(false);

    dispatch(closeScreenPlayer());

    const data = await triggerGetContentWithWatchHistory({
      userId: user?.id,
      contentIds: content.map((item) => item.id),
    }).unwrap();

    if (contentType === "series" || currentItem.type === "series") {
      const seasonData = await triggerSeasonWithEpisode({
        contentId: currentItem.id,
        userId: user?.id
      }).unwrap();
      setSeasonWithEpisodes(seasonData);
    }
  };

  // Use the unified More Like This content (already normalized with posterUrl)
  const normalizedRecommendedContent = moreLikeThisContent;

  // Handle More Like This clicks - ALWAYS switch current item within modal
  const handleMoreLikeThisClick = async (clickedItem) => {
    setCurrentItem(clickedItem);
    setMovie(clickedItem.id);

    const fetchSeasonWithEpisodes = await triggerSeasonWithEpisode({
      contentId: clickedItem?.id,
      userId: user?.id,
    }).unwrap();
    dispatch(
      openScreenPlayer({
        isOpen: true,
        isSeries: clickedItem?.type === "series",
        selectedVideo: clickedItem,
        seriesData:
          clickedItem?.type === "series" ? fetchSeasonWithEpisodes[0] : null,
        contentId: clickedItem.id,
      }),
    );
    dispatch(setShowAd(true));
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

  if (
    (isSeriesPlayerOpen && currentEpisode && seasonWithEpisodes.length > 0) ||
    isMovieOpen
  ) {
    return (
      <Dialog
        open={true}
        onOpenChange={(open) => !open && handleCloseSeriesPlayer()}
      >
        <DialogContent
          className="max-w-[100vw] w-screen h-screen p-0 m-0 border-none overflow-y-hidden bg-black z-[99999]"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <FullscreenPlayer
            isOpen={true}
            onClose={handleCloseSeriesPlayer} // This returns us to the Modal
            videoUrl={
              currentItem?.type === "movie"
                ? (currentItem as any)?.video_url
                : currentEpisode?.video_url
            }
            type={currentItem?.type}
            title={
              currentItem?.type === "movie"
                ? currentItem?.title
                : currentEpisode?.title
            }
            userId={user?.id}
            poster_url={
              currentContentItem?.poster_url || normalizedItem.posterUrl
            }
            movieId={currentContentItem?.id}
            season={seasonWithEpisodes}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        onInteractOutside={(e) => {
          if (isSeriesPlayerOpen || isMovieOpen) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (isSeriesPlayerOpen || isMovieOpen) {
            e.preventDefault();
          }
        }}
        className={`max-w-full md:max-w-[75vw] max-h-full md:max-h-[90vh] text-white border-none p-0 overflow-hidden transition-all duration-1000 ease-in-out opacity-0 scale-95 data-[state=open]:opacity-100 data-[state=open]:scale-100 ${getBackgroundStyles()}`}
        style={getDefaultBackgroundStyle()}
      >
        <DialogTitle className="sr-only">{normalizedItem.title}</DialogTitle>
        <ScrollArea className="max-h-[90vh] h-full scroll-smooth w-full">
          <div className="relative min-h-full w-full">
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
                  {isLoggedIn && (
                    <BrandButton
                      onClick={
                        contentType === "series"
                          ? handleResumeSeries
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
                  )}

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
                      <span className="text-white">{normalizedItem.genre}</span>
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
            <div className="max-w-7xl mx-auto w-full  md:p-8 pt-6 pb-0 relative">
              <div
                className={`absolute top-0 left-0 right-0 h-4 ${gradientStyles.contentGradient} pointer-events-none`}
              />

              {/* Series Episodes Section */}
              {contentType === "series" && (seasonsData.length > 0 || seasonWithEpisodes.length > 0) && (
                <div className="max-w-9xl mx-auto w-full mb-12 px-2 md:px-0">
                  {/* Continue Watching Row for Series */}
                  {continueWatchingEpisodes.length > 0 && (
                    <div className="mb-8 animate-in fade-in slide-in-from-left-4 duration-500 group/cw relative">
                      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 bg-brand-500 rounded-full"></span>
                        Continue Watching
                      </h2>

                      <div className="relative">
                        {/* Scroll Arrows */}
                        <div className="absolute top-1/2 -left-4 -translate-y-1/2 z-10 opacity-0 group-hover/cw:opacity-100 transition-opacity duration-300">
                          <button
                            onClick={() => scrollCW('left')}
                            className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/10 shadow-xl backdrop-blur-md"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                        </div>

                        <div className="absolute top-1/2 -right-4 -translate-y-1/2 z-10 opacity-0 group-hover/cw:opacity-100 transition-opacity duration-300">
                          <button
                            onClick={() => scrollCW('right')}
                            className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/10 shadow-xl backdrop-blur-md"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>

                        <div
                          ref={cwScrollRef}
                          className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide scroll-smooth snap-x"
                        >
                          {continueWatchingEpisodes.map((episode) => (
                            <div
                              key={`cw-${episode.id}`}
                              onClick={() =>
                                handlePlayEpisode(
                                  episode,
                                  episode.seasonNumber,
                                  episode.withinSeasonIndex,
                                  episode.actualSeasonData,
                                )
                              }
                              className="flex-shrink-0 w-64 group cursor-pointer relative snap-start"
                            >
                              <div className="aspect-video rounded-lg overflow-hidden bg-white/5 border border-white/10 group-hover:border-white/40 transition-all duration-300">
                                <img
                                  src={
                                    episode.thumbnail_url ||
                                    episode.poster_url ||
                                    normalizedItem.posterUrl
                                  }
                                  alt={episode.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center scale-0 group-hover:scale-100 transition-transform duration-300">
                                    <Play className="w-5 h-5 text-white fill-current" />
                                  </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                                  <div
                                    className="h-full bg-brand-500"
                                    style={{
                                      width: `${episode.watch_percentage ?? 0}%`,
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="mt-2">
                                <p className="text-xs text-brand-400 font-bold uppercase tracking-wider">
                                  Season {episode.seasonNumber} . Episode {episode.episode_number}
                                </p>
                                <h3 className="text-white font-medium truncate group-hover:text-brand-400 transition-colors">
                                  {episode.title}
                                </h3>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <Tabs defaultValue="season-1" className="w-full">
                    <TabsList
                      className={`flex flex-row flex-wrap justify-center items-center gap-3 w-full bg-transparent transition-all duration-300 group mb-8 ${effectiveKidsMode ? "" : ""}`}
                    >
                      {seasonWithEpisodes?.map((season) => (
                        <TabsTrigger
                          key={`season-${season.season_number}`}
                          value={`season-${season.season_number}`}
                          className={
                            effectiveKidsMode
                              ? "transition-all duration-300 hover:scale-105 will-change-transform transform-gpu leading-5 hover:text-white data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-[2px_19px_31px_rgba(59,130,246,0.35)] data-[state=active]:hover:bg-blue-600 hover:bg-blue-500/20"
                              : "transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-105 will-change-transform transform-gpu leading-5 hover:text-white data-[state=active]:bg-[linear-gradient(135deg,#7c3aed,#8b5cf6,#a855f7)] data-[state=active]:text-white data-[state=active]:border-2 data-[state=active]:border-[rgba(139,92,246,0.3)] data-[state=active]:shadow-[0_10px_30px_rgba(139,92,246,0.4)] data-[state=active]:hover:shadow-[0_20px_50px_rgba(139,92,246,0.6)] data-[state=active]:hover:brightness-110 data-[state=active]:hover:-translate-y-0.5 data-[state=active]:relative data-[state=active]:overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] before:transition-[left] before:duration-500 data-[state=active]:hover:before:left-full"
                          }
                          onClick={() =>
                            dispatch(
                              setSeriesData({
                                isSeries: true,
                                seriesData: season,
                              }),
                            )
                          }
                        >
                          Season {season.season_number}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    <div className="min-w-7xl mx-auto w-full">
                      {seasonWithEpisodes?.map((season) => (
                        <TabsContent
                          key={`season-${season.season_number}`}
                          value={`season-${season.season_number}`}
                          className="space-y-1"
                        >
                          {season.episodes.map((episode, index) => (
                            <div
                              key={episode.id}
                              onClick={() => {
                                if (isLoggedIn) {
                                handlePlayEpisode(
                                    episode,
                                    season.season_number,
                                    index,
                                    season,
                                  );
                                }
                            }}
                              className={`border flex items-center space-x-3 rounded-lg p-3 transition-all duration-300 group min-h-[4rem] ${isLoggedIn ? "cursor-pointer" : "cursor-default"} ${effectiveKidsMode
                                ? "border-blue-400/20 bg-blue-500/60 hover:border-white hover:shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                                : "border-brand-500/20 bg-black/60 hover:border-white hover:shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                                }`}
                            >
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <span className="text-white/60 font-medium text-sm w-6">
                                  {episode.episode_number}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-white font-medium text-sm line-clamp-1">
                                    {episode.title}
                                  </h3>
                                </div>
                              </div>
                              {isLoggedIn && (
                              <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePlayEpisode(
                                      episode,
                                      season.season_number,
                                      index,
                                      season,
                                    );
                                    dispatch(setShowAd(true));
                                  }}
                                  className="ml-3 p-2 rounded-full transition-colors bg-brand-500 hover:bg-brand-600 text-white flex-shrink-0"
                                  aria-label={`Play ${episode.title}`}
                                >
                                  <Play className="w-4 h-4 fill-current" />
                                </button>
                              )}
                          </div>
                          ))}
                        </TabsContent>
                      ))}
                    </div>
                  </Tabs>
                </div>
              )}
              <MovieDetailSection contents={currentItem} />
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
  );
};

export default ContentModal;
