import { useState } from "react";
import { Play } from "lucide-react";
import FullscreenPlayer from "./FullscreenPlayer";
import MovieModal from "./MovieModal";
import SeriesModal from "./SeriesModal";
import { useContent } from "@/hooks/useContent";
import { useChannels } from "@/hooks/useChannels";
import { useUserFavorites } from "@/hooks/useUserFavorites";

const MoreLikeThisCard = ({ item }: { item: any }) => {
  const { content } = useContent();
  const { channels } = useChannels();
  const { favoriteIds, addToFavorites, removeFromFavorites } =
    useUserFavorites();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenUrl, setFullscreenUrl] = useState<string | null>(null);
  const [fullscreenTitle, setFullscreenTitle] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const isSaved = favoriteIds.includes(item.id);
  const channel = channels.find((ch) => ch.id === item.channelId);
  const contentItem = content.find((c) => c.id === item.id);

  const recommendedContent = content
    .filter(
      (c) =>
        c.id !== item.id &&
        (c.genre === item.genre || c.channel_id === item.channelId),
    )
    .slice(0, 6);

  const handleSaveModal = () => {
    if (isSaved) {
      removeFromFavorites(item.id);
    } else {
      addToFavorites(item.id);
    }
  };

  const handlePlay = (videoUrl: string, title: string) => {
    setShowModal(false);
    setTimeout(() => {
      setFullscreenUrl(videoUrl);
      setFullscreenTitle(title);
      setIsFullscreen(true);
    }, 200);
  };

  const getSeriesSeasons = () => {
    try {
      const raw = contentItem?.seasons_data;
      if (!raw) return [];
      return typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      return [];
    }
  };

  const getFirstEpisode = () => {
    const seasons = getSeriesSeasons();
    const first = seasons?.[0]?.episodes?.[0];
    return first
      ? {
          videoUrl: first.video_url || first.videoUrl,
          title: `${item.title} - ${first.title}`,
        }
      : null;
  };

  const handleCardClick = () => {
    setShowModal(true);
  };

  return (
    <>
      {isFullscreen && fullscreenUrl && (
        <FullscreenPlayer
          isOpen={isFullscreen}
          onClose={() => setIsFullscreen(false)}
          videoUrl={fullscreenUrl}
          title={fullscreenTitle || item.title}
        />
      )}

      <div className="relative flex-shrink-0 w-64 group rounded-lg group-hover:shadow-[0_0_15px_rgba(253,121,35,0.6)] transition-all duration-300">
        <div className="relative overflow-hidden rounded-lg shadow-lg h-40 border border-transparent group-hover:border-brand-500 transition-all duration-300">
          <img
            src={item.posterUrl}
            alt={item.title}
            className="w-full h-full object-cover rounded-lg transform transition-transform duration-300 group-hover:scale-[1.1]"
          />
          
          <div className="absolute inset-0 z-0 rounded-lg overflow-hidden pointer-events-none">
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/90 via-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-10 p-3 pt-6 pointer-events-none">
            <h3 className="font-medium text-white text-sm line-clamp-2 transform transition-transform duration-300 origin-left group-hover:scale-[1.1]">
              {item.title}
            </h3>
          </div>

          <button
            className="absolute inset-0 z-20"
            onClick={handleCardClick}
          >
          </button>
        </div>
      </div>

      {/* Conditional Modal */}
      {showModal && item.type === "movie" && (
        <MovieModal
          isOpen={showModal}
          onClose={setShowModal}
          movie={item}
          isSaved={isSaved}
          onSave={handleSaveModal}
          onPlay={() => {
            if (item.video_url) {
              handlePlay(item.video_url, item.title);
            }
          }}
          videoUrl={item.video_url}
          contentItem={contentItem}
          channel={channel}
          recommendedContent={recommendedContent}
        />
      )}

      {showModal && item.type === "series" && (
        <SeriesModal
          isOpen={showModal}
          onClose={setShowModal}
          series={item}
          isSaved={isSaved}
          onSave={handleSaveModal}
          onPlayEpisode={(url, title) => handlePlay(url, title)}
          videoUrl={item.video_url}
          contentItem={contentItem}
          channel={channel}
          recommendedContent={recommendedContent}
        />
      )}
    </>
  );
};

export default MoreLikeThisCard;
