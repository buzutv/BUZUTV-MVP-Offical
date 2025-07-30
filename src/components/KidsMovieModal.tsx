import { Heart, Play, Star } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Movie } from "@/data/mockMovies";
import HomeRow from "@/components/HomeRow";
import BrandButton from "@/components/ui/BrandButton";
import { useRef, useState } from "react";
import KidsSeriesModal from "@/components/KidsSeriesModal";
import FullscreenPlayer from "@/components/FullscreenPlayer";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import { useContent } from "@/hooks/useContent";
import { useChannels } from "@/hooks/useChannels";

interface KidsMovieModalProps {
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
}

const KidsMovieModal = ({
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
}: KidsMovieModalProps) => {
  const [nestedMovie, setNestedMovie] = useState<Movie | null>(null);
  const [isNestedFullscreen, setIsNestedFullscreen] = useState(false);
  const [nestedVideoUrl, setNestedVideoUrl] = useState<string>("");
  const [nestedVideoTitle, setNestedVideoTitle] = useState<string>("");
  const { favoriteIds, addToFavorites, removeFromFavorites } =
    useUserFavorites();
  const { content } = useContent();
  const { channels } = useChannels();

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

  // Filter recommended content for kids content only
  const filteredRecommendedContent = recommendedContent.filter((item) => {
    return item.id !== movie.id && item.is_kids === true;
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
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[75vw] max-h-[90vh] text-white border-none p-0 overflow-hidden transition-all duration-1000 ease-in-out opacity-0 scale-95 data-[state=open]:opacity-100 data-[state=open]:scale-100 bg-gradient-to-tl from-yellow-300 via-blue-300 to-sky-400">
          <DialogTitle className="sr-only">{movie.title}</DialogTitle>
          <ScrollArea className="h-[90vh] scroll-smooth">
            <div className="relative min-h-full">
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
                <div className="absolute bottom-0 left-0 right-0 h-48 bg-[linear-gradient(to_top,_rgba(37,99,235,1)_0%,_rgba(37,99,235,0.7)_30%,_rgba(37,99,235,0.4)_60%,_transparent_90%)]" />

                {/* Title and Info Container */}
                <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
                  <h1
                    className="text-5xl font-bold text-white mb-6"
                    style={{
                      textShadow: "2px 2px 4px rgba(59, 130, 246, 0.8)",
                    }}
                  >
                    {movie.title}
                  </h1>

                  {/* Action Buttons Row */}
                  <div className="flex items-center space-x-4 mb-4">
                    <BrandButton
                      onClick={onPlay}
                      disabled={!videoUrl}
                      variant="kids"
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
                      className="bg-black/20 backdrop-blur-md text-white p-2 rounded-full transition-all duration-200 border  border-blue-400/50 hover:border-blue-400 hover:bg-black/30"
                    >
                      <Heart
                        className={`w-5 h-5 ${isSaved ? "fill-current text-red-500" : ""}`}
                      />
                    </button>

                    <BrandButton
                      variant="kids"
                      size="sm"
                      className="pointer-events-none"
                    >
                      {formatDuration(contentItem?.duration_minutes)}
                    </BrandButton>
                  </div>

                  {/* Kids-themed Info Row */}
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-green-400 font-semibold">
                        {movie.rating}
                      </span>
                    </div>
                    <span className="text-white font-medium">{movie.year}</span>
                    <span className="border border-blue-400 px-2 py-0.5 text-xs text-white font-medium bg-blue-500/90">
                      KIDS
                    </span>
                    <span className="bg-yellow-500 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      {movie.genre}
                    </span>
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
                <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-blue-600 to-transparent pointer-events-none" />

                {/* More Like This Section */}
                {filteredRecommendedContent.length > 0 && (
                  <HomeRow
                    title="More Like This"
                    items={normalizedRecommendedContent}
                    isMoreLikeThis={true}
                    onItemClick={(movie) => {
                      setNestedMovie(movie); // Open nested kids modal
                    }}
                  />
                )}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Nested modals for "More Like This" items */}
      {nestedMovie &&
        (() => {
          const nestedIsSaved = favoriteIds.includes(nestedMovie.id);
          const nestedContentItem = content.find(
            (item) => item.id === nestedMovie.id,
          );
          const nestedVideoUrl = nestedContentItem?.video_url;
          const nestedChannel = channels.find(
            (ch) => ch.id === nestedMovie.channelId,
          );
          const nestedRecommendedContent = content
            .filter(
              (item) => item.id !== nestedMovie.id && item.is_kids === true,
            )
            .slice(0, 6);

          const handleNestedSave = () => {
            if (nestedIsSaved) {
              removeFromFavorites(nestedMovie.id);
            } else {
              addToFavorites(nestedMovie.id);
            }
          };

          const handleNestedPlay = () => {
            if (nestedVideoUrl) {
              // Close the nested modal and start fullscreen player
              setNestedMovie(null);
              setNestedVideoUrl(nestedVideoUrl);
              setNestedVideoTitle(nestedMovie.title);
              setIsNestedFullscreen(true);
            }
          };

          const handleNestedPlayEpisode = (
            url: string,
            episodeTitle: string,
          ) => {
            // Close the nested modal and start fullscreen player for episodes
            setNestedMovie(null);
            setNestedVideoUrl(url);
            setNestedVideoTitle(episodeTitle);
            setIsNestedFullscreen(true);
          };

          return nestedMovie.type === "series" ? (
            <KidsSeriesModal
              isOpen={!!nestedMovie}
              onClose={() => setNestedMovie(null)}
              series={nestedMovie}
              isSaved={nestedIsSaved}
              onSave={handleNestedSave}
              onPlayEpisode={handleNestedPlayEpisode}
              videoUrl={nestedVideoUrl}
              contentItem={nestedContentItem}
              channel={nestedChannel}
              recommendedContent={nestedRecommendedContent}
            />
          ) : (
            <KidsMovieModal
              isOpen={!!nestedMovie}
              onClose={() => setNestedMovie(null)}
              movie={nestedMovie}
              isSaved={nestedIsSaved}
              onSave={handleNestedSave}
              onPlay={handleNestedPlay}
              videoUrl={nestedVideoUrl}
              contentItem={nestedContentItem}
              channel={nestedChannel}
              recommendedContent={nestedRecommendedContent}
            />
          );
        })()}

      {/* Nested Fullscreen Player */}
      {isNestedFullscreen && nestedVideoUrl && (
        <FullscreenPlayer
          isOpen={isNestedFullscreen}
          onClose={() => {
            setIsNestedFullscreen(false);
            setNestedVideoUrl("");
            setNestedVideoTitle("");
          }}
          videoUrl={nestedVideoUrl}
          title={nestedVideoTitle}
        />
      )}
    </>
  );
};

export default KidsMovieModal;
