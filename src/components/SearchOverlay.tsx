import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { Search, X, Film, Tv, MonitorPlay } from "lucide-react";
import { useContent } from "@/hooks/useContent";
import { useChannels } from "@/hooks/useChannels";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import ContentModal from "@/components/ContentModal";
import FullscreenPlayer from "@/components/FullscreenPlayer";
import ChannelCard from "@/components/ChannelCard";
import ChannelModal from "@/components/ChannelModal";
import ContentCard from "@/components/ContentCard";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SearchOverlayProps {
  searchQuery: string;
  isVisible: boolean;
  onClose: () => void;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({ searchQuery, isVisible, onClose }) => {
  const { content } = useContent();
  const { channels } = useChannels();
  const { favoriteIds, addToFavorites, removeFromFavorites } = useUserFavorites();

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenVideoUrl, setFullscreenVideoUrl] = useState("");
  const [fullscreenVideoTitle, setFullscreenVideoTitle] = useState("");

  // Lock scroll when visible
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = "hidden";
    } else {
      setSelectedItem(null);
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isVisible]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isVisible) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, onClose]);


  // Filter content based on search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return {
        channels: [],
        movies: [],
        series: [],
      };
    }

    const query = searchQuery.toLowerCase().trim();

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
  }, [searchQuery, content, channels]);

  // Convert content to formatted objects
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
      user_watch_history: item.user_watch_history,
    });

    const formatChannelItem = (channel: any) => ({
      id: channel.id,
      name: channel.name,
      logoUrl: channel.logo_url || "/placeholder.svg",
      description: channel.description,
      contentCount: 0,
    });

    return {
      channels: searchResults.channels.map(formatChannelItem),
      movies: searchResults.movies.map(formatContentItem),
      series: searchResults.series.map(formatContentItem),
    };
  }, [searchResults]);

  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  const handleCloseChannelModal = () => {
    setSelectedChannel(null);
  };

  const hasResults =
    formattedResults?.channels?.length > 0 ||
    formattedResults?.movies?.length > 0 ||
    formattedResults?.series?.length > 0;

  // if (!isOpen) return null;

  return (
    <div className="fixed inset-0 w-1/2 h-1/2 flex justify-center z-50 bg-black/95 backdrop-blur-xl animate-in fade-in duration-200">

      {/* Header / Search Input */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-white/10 bg-black/50">
        <Search className="w-5 h-5 text-gray-400" />
        {/* <input
          ref={inputRef}
          className="flex-1 bg-transparent border-none text-xl text-white placeholder:text-gray-500 font-medium outline-none"
          placeholder="Search movies, TV shows, channels..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoComplete="off"
        /> */}
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <ScrollArea className="h-[calc(100vh-80px)] px-6 py-6">
        {!searchQuery ? (
          <div className="flex flex-col items-center justify-center pt-20 text-center space-y-4 text-gray-500">
            <Search className="w-16 h-16 opacity-20" />
            <p className="text-xl font-medium">Search for your favorite content</p>
            <p className="text-sm max-w-md">Find movies, TV shows, and live channels from our extensive library.</p>
          </div>
        ) : !hasResults ? (
          <div className="flex flex-col items-center justify-center pt-20 text-center space-y-4 text-gray-500">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <Search className="w-8 h-8 opacity-40" />
            </div>
            <p className="text-lg font-medium text-gray-300">No results found for "{searchQuery}"</p>
            <p className="text-sm">Try searching for something else or check your spelling.</p>
          </div>
        ) : (
          <div className="space-y-10 pb-20 max-w-[1800px] mx-auto">
            {/* Channels */}
            {formattedResults.channels.length > 0 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 text-xl font-semibold text-white">
                  <MonitorPlay className="w-5 h-5 text-brand-500" />
                  <h3>Channels</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {formattedResults.channels.map((channel) => (
                    <div
                      key={channel.id}
                      onClick={() => setSelectedChannel(channel)}
                      className="cursor-pointer transition-transform hover:scale-105"
                    >
                      <ChannelCard channel={channel} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Movies */}
            {formattedResults.movies.length > 0 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                <div className="flex items-center gap-2 text-xl font-semibold text-white">
                  <Film className="w-5 h-5 text-brand-500" />
                  <h3>Movies</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {formattedResults.movies.map((movie) => (
                    <div key={movie.id} className="group hover:scale-105 transition-transform duration-200">
                      <ContentCard
                        item={movie}
                        variant="movie"
                        autoDetectKids={true}
                        onItemClick={(item) => setSelectedItem(item)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TV Shows */}
            {formattedResults.series.length > 0 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                <div className="flex items-center gap-2 text-xl font-semibold text-white">
                  <Tv className="w-5 h-5 text-brand-500" />
                  <h3>TV Shows</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {formattedResults.series.map((series) => (
                    <div key={series.id} className="group hover:scale-105 transition-transform duration-200">
                      <ContentCard
                        item={series}
                        variant="series"
                        autoDetectKids={true}
                        onItemClick={(item) => setSelectedItem(item)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Nested Modals */}
      <ChannelModal
        isOpen={!!selectedChannel}
        onClose={handleCloseChannelModal}
        channel={selectedChannel}
      />

      {selectedItem && (() => {
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
                userId={process.env.NODE_ENV === "development" ? "03fa9a91-4281-4bd4-9e60-4da2ba72b0f3" : (selectedItem.user_id || "")}
                type={selectedItem.type || "movie"}
                movieId={selectedItem.id}
              />
            )}

            <ContentModal
              isOpen={!!selectedItem && !isFullscreen}
              onClose={(open) => !open && handleCloseModal()}
              item={selectedItem}
              variant={selectedItem.type}
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
        )
      })()}
    </div>
  );
};

export default SearchOverlay;
