import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Filter, UserCheck, UserPlus, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ContentCard from "@/components/ContentCard";

import { useContent } from "@/hooks/useContent";
import { useUserChannelFavorites } from "@/hooks/useUserChannelFavorites";
import { Movie } from "@/data/mockMovies";
import { getOptimizedImageUrl } from "@/utils/youtubeUtils";

interface Channel {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  logo_url?: string;
  banner_url?: string;
}

interface ChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: Channel | null;
}

// Helper function to convert YouTube URLs to embed format
const getYouTubeEmbedUrl = (url: string): string | null => {
  if (!url) return null;

  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);

  if (match && match[2].length === 11) {
    const videoId = match[2];
    return `https://www.youtube.com/embed/${videoId}`;
  }

  return null;
};

const ChannelModal = ({ isOpen, onClose, channel }: ChannelModalProps) => {
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "year" | "rating">(
    "newest",
  );
  const [genreFilter, setGenreFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>("");

  const { content } = useContent();
  const {
    favoriteChannelIds,
    addChannelToFavorites,
    removeChannelFromFavorites,
  } = useUserChannelFavorites();

  // Check if channel is in favorites
  const isChannelFavorite = channel
    ? favoriteChannelIds.includes(channel.id)
    : false;

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!channel) return;

    if (isChannelFavorite) {
      removeChannelFromFavorites(channel.id);
    } else {
      addChannelToFavorites(channel.id);
    }
  };

  // Get content associated with this channel from backend data
  const channelContent = useMemo(() => {
    if (!channel) return [];

    // Filter content by channel_id
    const filteredContent = content.filter(
      (item) => item.channel_id === channel.id,
    );

    // Convert backend content to Movie format for compatibility with MovieCard
    return filteredContent.map(
      (item) =>
        ({
          id: item.id,
          title: item.title,
          description: item.description || "",
          year: item.year || new Date().getFullYear(),
          genre: item.genre || "Unknown",
          rating: item.rating || 0,
          posterUrl: item.poster_url || "/placeholder.svg",
          backdropUrl: item.backdrop_url || "/placeholder.svg",
          duration: item.duration_minutes || 0,
          channelId: item.channel_id || "",
          youtubeId: "",
          isTrending: item.is_trending || false,
          isFeatured: item.is_featured || false,
          isKids: item.is_kids || false,
          type: item.type,
        }) as Movie,
    );
  }, [channel, content]);

  // Apply filters and sorting
  const filteredAndSortedContent = useMemo(() => {
    let filtered = [...channelContent];

    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter((item) => item.type === typeFilter);
    }

    // Filter by genre
    if (genreFilter !== "all") {
      filtered = filtered.filter((item) => item.genre === genreFilter);
    }

    // Filter by year
    if (yearFilter !== "all") {
      filtered = filtered.filter((item) => item.year === parseInt(yearFilter));
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return b.year - a.year;
        case "oldest":
          return a.year - b.year;
        case "year":
          return b.year - a.year;
        case "rating":
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

    return filtered;
  }, [channelContent, sortBy, genreFilter, yearFilter, typeFilter]);

  // Get unique values for filters
  const availableGenres = useMemo(() => {
    const genres = [...new Set(channelContent.map((item) => item.genre))];
    return genres.filter(Boolean);
  }, [channelContent]);

  const availableYears = useMemo(() => {
    const years = [
      ...new Set(channelContent.map((item) => item.year.toString())),
    ];
    return years.sort((a, b) => parseInt(b) - parseInt(a));
  }, [channelContent]);

  const availableTypes = useMemo(() => {
    const types = [...new Set(channelContent.map((item) => item.type))];
    return types.filter(Boolean);
  }, [channelContent]);

  const handleCloseVideo = () => {
    setIsPlaying(false);
    setCurrentVideoUrl("");
  };

  if (!channel) return null;

  return (
    <>
      {/* Full Screen Video Player */}
      {isPlaying && currentVideoUrl && (
        <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
          <button
            onClick={handleCloseVideo}
            className="absolute top-4 right-4 z-[10000] bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="w-full h-full flex items-center justify-center">
            {currentVideoUrl.includes("youtube.com/embed") ? (
              <iframe
                src={`${currentVideoUrl}?autoplay=1&controls=1&rel=0&fs=1&playsinline=1`}
                className="w-full h-full"
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowFullScreen
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            ) : (
              <video
                src={currentVideoUrl}
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

      <Dialog open={isOpen && !isPlaying} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] bg-[#131313] text-white border-black/50 overflow-hidden p-0">
          <div className="flex flex-col h-[95vh]">
            {/* Header */}
            <DialogHeader className="p-6 pb-4 border-b border-black/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  {(channel.logo_url || channel.logoUrl) && (
                    <img
                      src={getOptimizedImageUrl(channel.logo_url || channel.logoUrl, 400)}
                      alt={channel.name}
                      className="w-12 h-12 object-contain rounded"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <DialogTitle className="text-3xl font-bold">
                        {channel.name}
                      </DialogTitle>
                      <button
                        onClick={handleToggleFavorite}
                        className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black ${isChannelFavorite
                          ? "bg-green-600 text-white hover:bg-green-500 focus:ring-green-500"
                          : "bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 focus:ring-white"
                          }`}
                        aria-label={
                          isChannelFavorite
                            ? "Remove from favorites"
                            : "Add to favorites"
                        }
                      >
                        {isChannelFavorite ? (
                          <UserCheck size={16} />
                        ) : (
                          <UserPlus size={16} />
                        )}
                        {isChannelFavorite ? "Subscribed" : "Subscribe"}
                      </button>
                    </div>
                    {channel.description && (
                      <p className="text-gray-400 mt-1">
                        {channel.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* Filters */}
            <div className="p-6 pb-4 border-b border-black/50 ">
              <div className="flex items-center flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">
                    Filters:
                  </span>
                </div>

                {/* Sort by */}
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value as "newest" | "oldest" | "year" | "rating",
                    )
                  }
                  className="bg-black/40 backdrop-blur-md border border-brand-500/40 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-white hover:bg-black/60 hover:border-brand-500/60 transition-all duration-300 appearance-none cursor-pointer shadow-lg min-w-[140px]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: "right 8px center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "16px",
                    paddingRight: "40px",
                  }}
                >
                  <option value="newest" className="bg-black text-white">
                    Newest First
                  </option>
                  <option value="oldest" className="bg-black text-white">
                    Oldest First
                  </option>
                  <option value="year" className="bg-black text-white">
                    By Year
                  </option>
                  <option value="rating" className="bg-black text-white">
                    By Rating
                  </option>
                </select>

                {/* Type filter */}
                {availableTypes.length > 1 && (
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="bg-black/40 backdrop-blur-md border border-brand-500/40 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-white hover:bg-black/60 hover:border-brand-500/60 transition-all duration-300 appearance-none cursor-pointer shadow-lg min-w-[120px]"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: "right 8px center",
                      backgroundRepeat: "no-repeat",
                      backgroundSize: "16px",
                      paddingRight: "40px",
                    }}
                  >
                    <option value="all" className="bg-black text-white">
                      All Types
                    </option>
                    {availableTypes.map((type) => (
                      <option
                        key={type}
                        value={type}
                        className="bg-black text-white"
                      >
                        {type === "movie" ? "Movies" : "TV Shows"}
                      </option>
                    ))}
                  </select>
                )}

                {/* Genre filter */}
                {availableGenres.length > 0 && (
                  <select
                    value={genreFilter}
                    onChange={(e) => setGenreFilter(e.target.value)}
                    className="bg-black/40 backdrop-blur-md border border-brand-500/40 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-white hover:bg-black/60 hover:border-brand-500/60 transition-all duration-300 appearance-none cursor-pointer shadow-lg min-w-[130px]"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: "right 8px center",
                      backgroundRepeat: "no-repeat",
                      backgroundSize: "16px",
                      paddingRight: "40px",
                    }}
                  >
                    <option value="all" className="bg-black text-white">
                      All Genres
                    </option>
                    {availableGenres.map((genre) => (
                      <option
                        key={genre}
                        value={genre}
                        className="bg-black text-white"
                      >
                        {genre}
                      </option>
                    ))}
                  </select>
                )}

                {/* Year filter */}
                {availableYears.length > 0 && (
                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="bg-black/40 backdrop-blur-md border border-brand-500/40 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-white hover:bg-black/60 hover:border-brand-500/60 transition-all duration-300 appearance-none cursor-pointer shadow-lg min-w-[110px]"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: "right 8px center",
                      backgroundRepeat: "no-repeat",
                      backgroundSize: "16px",
                      paddingRight: "40px",
                    }}
                  >
                    <option value="all" className="bg-black text-white">
                      All Years
                    </option>
                    {availableYears.map((year) => (
                      <option
                        key={year}
                        value={year}
                        className="bg-black text-white"
                      >
                        {year}
                      </option>
                    ))}
                  </select>
                )}

                <span className="text-sm text-gray-400 ml-auto">
                  {filteredAndSortedContent.length} item
                  {filteredAndSortedContent.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Content Grid */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="px-4 py-6">
                  {filteredAndSortedContent.length > 0 ? (
                    <div className="flex flex-wrap gap-4">
                      <div className="flex flex-wrap gap-4 w-full py-2">
                        {filteredAndSortedContent.map((movie) => (
                          <div key={movie.id} className="flex-shrink-0 w-64">
                            <ContentCard
                              item={movie}
                              variant="auto"
                              autoDetectKids={true}
                              width="w-64"
                              onPlayFullscreen={(videoUrl) => {
                                const embedUrl =
                                  getYouTubeEmbedUrl(videoUrl) || videoUrl;
                                setCurrentVideoUrl(embedUrl);
                                setIsPlaying(true);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <div className="max-w-md mx-auto">
                        <h3 className="text-xl font-medium text-white mb-3">
                          No content found
                        </h3>
                        <p className="text-gray-400">
                          {channelContent.length === 0
                            ? `No content has been added to ${channel.name} yet.`
                            : "No content matches your current filters for this channel."}
                        </p>
                        {channelContent.length > 0 && (
                          <button
                            onClick={() => {
                              setSortBy("newest");
                              setGenreFilter("all");
                              setYearFilter("all");
                              setTypeFilter("all");
                            }}
                            className="mt-4 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors shadow-[2px_19px_31px_rgba(30,27,95,0.35)]"
                            style={{
                              backgroundImage: `
                                radial-gradient(93% 87% at 87% 89%, rgba(0, 0, 0, 0.23) 0%, transparent 86.18%),
                                radial-gradient(66% 87% at 26% 20%, rgba(255, 255, 255, 0.41) 0%, rgba(255, 255, 255, 0) 70%)
                              `,
                            }}
                          >
                            Clear Filters
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChannelModal;
