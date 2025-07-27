import { Heart, Play, Star } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Movie } from "@/data/mockMovies";
import HomeRow from "@/components/HomeRow";
import BrandButton from "@/components/ui/BrandButton";
import { useRef } from "react";

interface MovieModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  movie: Movie;
  isSaved: boolean;
  onSave: () => void;
  onPlay: () => void;
  videoUrl?: string;
  contentItem?: any;
  channel?: any;
  recommendedContent: any[];
  onOpenRelatedMovie?: (movie: Movie) => void;
  skipContentFiltering?: boolean;
  customBackground?: string;
}

const MovieModal = ({
  isOpen,
  onClose,
  movie,
  isSaved,
  onSave,
  onPlay,
  videoUrl,
  contentItem,
  channel,
  recommendedContent,
  onOpenRelatedMovie,
  skipContentFiltering = false,
  customBackground,
}: MovieModalProps) => {
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

  // Filter recommended content by same genre or channel (unless filtering is skipped)

  const filteredRecommendedContent = skipContentFiltering
    ? recommendedContent.filter((item) => item.id !== movie.id)
    : recommendedContent.filter((item) => {
        const passesId = item.id !== movie.id;

        // If current movie is kids content, show only kids content in recommendations
        // If current movie is not kids content, exclude kids content from recommendations
        const passesKids =
          movie.isKids || contentItem?.is_kids
            ? item.is_kids === true // Show only kids content
            : !item.is_kids; // Exclude kids content

        const passesGenre =
          item.genre === movie.genre ||
          item.channel_id === movie.channelId ||
          item.channel_id === contentItem?.channel_id;

        return passesId && passesKids && passesGenre;
      });

  const normalizedRecommendedContent = filteredRecommendedContent.map(
    (item) => ({
      ...item,
      posterUrl: item.posterUrl || item.poster_url,
    }),
  );

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };
  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`max-w-[75vw] max-h-[90vh] text-white border-none p-0 overflow-hidden transition-all duration-1000 ease-in-out opacity-0 scale-95 data-[state=open]:opacity-100 data-[state=open]:scale-100 ${customBackground ? customBackground : ""}`}
        style={
          !customBackground
            ? {
                background: `
            linear-gradient(
              200deg,
              #311066 0%,   /* very dark violet */
              #1D0833 20%,  /* deep blackish purple */
              #120222 45%,  /* near-black violet */
              black 100%    /* pure black */
            )`,
              }
            : {}
        }
      >
        <DialogTitle className="sr-only">{movie.title}</DialogTitle>
        <ScrollArea className="h-[90vh] scroll-smooth">
          <div className="relative min-h-full ">
            {/* Hero Section with Fixed Gradient */}
            <div className="relative w-full h-[60vh] overflow-hidden">
              {/* Background Image */}
              <div className="absolute inset-0">
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Only bottom gradient for fade effect */}
              <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black via-black/60 to-transparent" />

              {/* Title and Info Container */}
              <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
                <h1 className="text-5xl font-bold text-white mb-6">
                  {movie.title}
                </h1>

                {/* Action Buttons Row */}
                <div className="flex items-center space-x-4 mb-4">
                  <BrandButton
                    onClick={onPlay}
                    disabled={!videoUrl}
                    variant={
                      customBackground?.includes("kids") ? "kids" : "primary"
                    }
                    size="md"
                    className={
                      !videoUrl
                        ? "!bg-gray-600 !text-gray-400 !cursor-not-allowed !hover:bg-gray-600 !hover:-translate-y-0"
                        : ""
                    }
                  >
                    <Play className="w-6 h-6 fill-current" />
                    <span>Play</span>
                  </BrandButton>

                  <button
                    onClick={onSave}
                    className="bg-black/20 backdrop-blur-md text-white p-2 rounded-full transition-all duration-200 border border-brand-500/50 hover:border-brand-500 hover:bg-black/30"
                  >
                    <Heart
                      className={`w-5 h-5 ${isSaved ? "fill-current text-red-500" : ""}`}
                    />
                  </button>

                  <span className="text-white text-xl font-medium">
                    {formatDuration(contentItem?.duration_minutes)}
                  </span>
                </div>

                {/* Netflix-style Info Row */}
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-green-400 font-semibold">
                      {movie.rating}
                    </span>
                  </div>
                  <span className="text-white font-medium">{movie.year}</span>
                  <span className="border border-brand-500 px-2 py-0.5 text-xs text-gray-300 font-medium">
                    TV-MA
                  </span>
                  <span className="text-white">{movie.genre}</span>
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
              <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-black to-transparent pointer-events-none" />

              {/* More Like This Section */}
              {filteredRecommendedContent.length > 0 && (
                <HomeRow
                  title="More Like This"
                  items={normalizedRecommendedContent}
                  isMoreLikeThis={true}
                  onItemClick={(movie) => {
                    onClose(false); // Close current modal
                    onOpenRelatedMovie?.(movie); // Open new modal with selected movie
                  }}
                />
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default MovieModal;
