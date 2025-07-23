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

      <div className="relative flex-shrink-0 w-64 group">
        <img
          src={item.posterUrl}
          alt={item.title}
          className="w-full h-40 object-cover rounded-lg"
        />
        <button
          className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleCardClick}
        >
          <Play className="w-12 h-12 text-white" />
        </button>
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
