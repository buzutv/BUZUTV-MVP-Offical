import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Search, X } from "lucide-react";
import { useContent } from "@/hooks/useContent";
import { useChannels } from "@/hooks/useChannels";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import ContentModal from "@/components/ContentModal";
import FullscreenPlayer from "@/components/FullscreenPlayer";
import ChannelCard from "@/components/ChannelCard";
import ChannelModal from "@/components/ChannelModal";
import ContentCard from "@/components/ContentCard";

interface SearchOverlayProps {
  searchQuery: string;
  isVisible: boolean;
  onClose: () => void;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({
  searchQuery,
  isVisible,
  onClose,
}) => {
  const { content } = useContent();
  const { channels } = useChannels();
  const { favoriteIds, addToFavorites, removeFromFavorites } =
    useUserFavorites();

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenVideoUrl, setFullscreenVideoUrl] = useState("");
  const [fullscreenVideoTitle, setFullscreenVideoTitle] = useState("");
  const [internalSearchQuery, setInternalSearchQuery] = useState(searchQuery);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Update internal search query when external searchQuery changes
  useEffect(() => {
    setInternalSearchQuery(searchQuery);
  }, [searchQuery]);

  // Define handleClose function before useEffect
  const handleClose = useCallback(() => {
    setInternalSearchQuery("");
    onClose();
  }, [onClose]);

  // Focus search input when overlay opens
  useEffect(() => {
    if (isVisible && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isVisible]);

  // Handle keyboard events for closing overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isVisible) {
        handleClose();
      }
    };

    if (isVisible) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isVisible, handleClose]);

  // Filter content based on internal search query
  const searchResults = useMemo(() => {
    if (!internalSearchQuery.trim()) {
      return {
        channels: [],
        movies: [],
        series: [],
      };
    }

    const query = internalSearchQuery.toLowerCase().trim();

    // Filter channels
    const channelResults = channels.filter(
      (channel) =>
        channel.name?.toLowerCase().includes(query) ||
        channel.description?.toLowerCase().includes(query) ||
        channel.genre?.toLowerCase().includes(query),
    );

    // Filter content
    const contentResults = content.filter((item) => {
      const titleMatch = item.title?.toLowerCase().includes(query);
      const genreMatch = item.genre?.toLowerCase().includes(query);
      const channelMatch = channels
        .find((ch) => ch.id === item.channel_id)
        ?.name?.toLowerCase()
        .includes(query);

      return titleMatch || genreMatch || channelMatch;
    });

    // Separate movies and series
    const movies = contentResults.filter((item) => item.type === "movie");
    const series = contentResults.filter((item) => item.type === "series");

    return {
      channels: channelResults,
      movies,
      series,
    };
  }, [internalSearchQuery, content, channels]);

  // Convert content to formatted objects for components
  const formattedResults = useMemo(() => {
    const formatContentItem = (item: any) => ({
      id: item.id,
      title: item.title,
      description: item.description || "",
      posterUrl: item.poster_url || "/placeholder.svg",
      youtubeId: item.youtube_id || "",
      rating: item.rating || 0,
      year: item.year || new Date().getFullYear(),
      genre: item.genre || "",
      isTrending: item.is_trending || false,
      isFeatured: item.is_featured || false,
      isKids: item.is_kids || false,
      type: (item.type || "movie") as "movie" | "series",
      channelId: item.channel_id,
      seasons: item.seasons,
      episodes: item.episodes,
      created_at: item.created_at,
    });

    const formatChannelItem = (channel: any) => ({
      id: channel.id,
      name: channel.name,
      logoUrl: channel.logo_url || "/placeholder.svg",
      description: channel.description,
      contentCount: 0, // Default value since this might not be available
    });

    return {
      channels: searchResults.channels.map(formatChannelItem),
      movies: searchResults.movies.map(formatContentItem),
      series: searchResults.series.map(formatContentItem),
    };
  }, [searchResults]);

  const handleCardClick = (item: any) => {
    setSelectedItem(item);
  };

  const handleCloseModal = (open: boolean) => {
    if (!open) setSelectedItem(null);
  };

  const handleCloseChannelModal = () => {
    setSelectedChannel(null);
  };

  const handleChannelClick = (channel: any) => {
    setSelectedChannel(channel);
  };

  // Calculate if we have any results
  const hasResults =
    formattedResults?.channels?.length > 0 ||
    formattedResults?.movies?.length > 0 ||
    formattedResults?.series?.length > 0;

  if (!isVisible) return null;

  return (
    <div
      className="fixed left-0 right-0 z-50 bg-gradient-to-t from-black via-brand-800 to-brand-500"
      style={{ top: "64px", height: "calc(100vh - 64px)" }}
    >
      {/* Header */}
      <div className="sticky top-0 bg-black/20 backdrop-blur-sm p-4 z-50">
        <div className="max-w-7xl mx-auto flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search movies, series, channels..."
              value={internalSearchQuery}
              onChange={(e) => setInternalSearchQuery(e.target.value)}
              className="bg-black/20 backdrop-blur-md border border-transparent rounded-lg pl-12 pr-4 py-3 w-full focus:outline-none focus:border-brand-500 focus:shadow-[0_0_0_3px_rgba(253,121,35,0.3)] transition-all duration-200 text-white"
            />
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
            style={{ position: "absolute", right: 32, top: 24 }}
            aria-label="Close search overlay"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Search Results - scrollable, no visible scrollbar */}
      <div
        className="max-w-7xl mx-auto px-4 py-8 overflow-y-auto scrollbar-hide"
        style={{ maxHeight: "calc(100vh - 64px - 80px)" }}
      >
        <div className="mb-6">
          {!internalSearchQuery ? (
            <h2 className="text-xl font-semibold text-white inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 px-6 py-2 shadow hover:from-brand-600 hover:to-brand-800 transition-all">
              Browse All Content
            </h2>
          ) : (
            <h2 className="text-2xl font-bold text-white">Search Results</h2>
          )}
        </div>
        {!hasResults && internalSearchQuery && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-brand-500 mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-xl font-bold text-white mb-2">
              No results for &ldquo;{internalSearchQuery}&rdquo;
            </h3>
            <p className="text-gray-400">Try different keywords</p>
          </div>
        )}
        {formattedResults?.channels?.length > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl text-white mb-3">Channels</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {formattedResults.channels.map((channel) => (
                <div
                  key={channel.id}
                  onClick={(e) => {
                    // Only handle click if it's not on the favorite button
                    if (!(e.target as HTMLElement).closest("button")) {
                      handleChannelClick(channel);
                    }
                  }}
                  className="cursor-pointer"
                >
                  <ChannelCard channel={channel} />
                </div>
              ))}
            </div>
          </div>
        )}
        {formattedResults?.movies?.length > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl text-white mb-3">Movies</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {formattedResults.movies.map((movie) => (
                <div
                  key={movie.id}
                  className="group hover:scale-105 transition-transform duration-200"
                >
                  <ContentCard item={movie} variant="movie" autoDetectKids={true} />
                </div>
              ))}
            </div>
          </div>
        )}
        {formattedResults?.series?.length > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl text-white mb-3">TV Shows</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {formattedResults.series.map((series) => (
                <div
                  key={series.id}
                  className="group hover:scale-105 transition-transform duration-200"
                >
                  <ContentCard item={series} variant="series" autoDetectKids={true} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ChannelModal
        isOpen={!!selectedChannel}
        onClose={handleCloseChannelModal}
        channel={selectedChannel}
      />

      {selectedItem &&
        (() => {
          const isSaved = favoriteIds.includes(selectedItem.id);
          const contentItem = content.find(
            (item) => item.id === selectedItem.id,
          );
          const videoUrl = contentItem?.video_url;
          const channel = channels.find(
            (ch) => ch.id === selectedItem.channelId,
          );

          const recommendedContent = content
            .filter((item) => {
              const passesId = item.id !== selectedItem.id;
              const passesKids =
                selectedItem.isKids || contentItem?.is_kids
                  ? item.is_kids === true
                  : !item.is_kids;
              const passesGenre =
                item.genre === selectedItem.genre ||
                item.channel_id === selectedItem.channelId;
              return passesId && passesKids && passesGenre;
            })
            .slice(0, 6)
            .map((item) => ({
              ...item,
              posterUrl: item.poster_url || "/placeholder.svg",
            }));

          const handleSaveModal = () => {
            if (isSaved) {
              removeFromFavorites(selectedItem.id);
            } else {
              addToFavorites(selectedItem.id);
            }
          };

          const handleModalPlayClick = () => {
            if (videoUrl) {
              setIsFullscreen(true);
            }
          };

          const handlePlayEpisode = (
            videoUrl: string,
            episodeTitle: string,
          ) => {
            setFullscreenVideoUrl(videoUrl);
            setFullscreenVideoTitle(episodeTitle);
            setIsFullscreen(true);
          };

          const handleExitFullscreen = () => {
            setIsFullscreen(false);
            setFullscreenVideoUrl("");
            setFullscreenVideoTitle("");
          };

          return (
            <>
              {isFullscreen && (videoUrl || fullscreenVideoUrl) && (
                <FullscreenPlayer
                  isOpen={isFullscreen}
                  onClose={handleExitFullscreen}
                  videoUrl={fullscreenVideoUrl || videoUrl}
                  title={fullscreenVideoTitle || selectedItem.title}
                />
              )}

              <ContentModal
                isOpen={!!selectedItem && !isFullscreen}
                onClose={handleCloseModal}
                item={selectedItem}
                variant="auto"
                autoDetectKids={true}
                isSaved={isSaved}
                onSave={handleSaveModal}
                onPlay={selectedItem.type === "movie" ? handleModalPlayClick : undefined}
                onPlayEpisode={selectedItem.type === "series" ? handlePlayEpisode : undefined}
                videoUrl={videoUrl}
                contentItem={contentItem}
                channel={channel}
                recommendedContent={recommendedContent}
              />
            </>
          );
        })()}
    </div>
  );
};

export default SearchOverlay;
