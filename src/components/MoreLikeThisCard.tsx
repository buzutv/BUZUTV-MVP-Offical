import { useState } from "react";
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

      <div className="relative flex-shrink-0 w-64 group border-2 border-transparent hover:scale-105 hover:border-white hover:shadow-[0_0_4px_rgba(255,255,255,0.6)] rounded-lg transition-all duration-300 overflow-hidden">
        <div
          className="relative overflow-hidden transition-all duration-300"
          style={{ aspectRatio: "16/9" }}
        >
          <img
            src={item.posterUrl}
            alt={item.title}
            className="w-full h-full object-cover rounded-lg transform transition-transform duration-300 hover:scale-[1.1]"
          />

          <div className="absolute inset-0 z-0 rounded-lg overflow-hidden pointer-events-none">
            <div
              className={`absolute bottom-[-1px] left-0 right-0 h-1/2 ${
                location.pathname === "/kids"
                  ? "bg-[linear-gradient(to_top,_rgba(37,99,235,0.95)_0%,_rgba(37,99,235,0.7)_30%,_rgba(37,99,235,0.4)_60%,_rgba(37,99,235,0.2)_80%,_rgba(37,99,235,0.1)_90%,_transparent_100%)]"
                  : "bg-[linear-gradient(to_top,_rgba(0,0,0,0.95)_0%,_rgba(0,0,0,0.7)_30%,_rgba(0,0,0,0.4)_60%,_rgba(0,0,0,0.2)_80%,_rgba(0,0,0,0.1)_90%,_transparent_100%)]"
              }`}
            />
            <div
              className={`absolute bottom-[-1px] left-0 right-0 h-1/2 ${
                location.pathname === "/kids"
                  ? "bg-[linear-gradient(to_top,_rgba(37,99,235,0.95)_0%,_rgba(37,99,235,0.7)_30%,_rgba(37,99,235,0.4)_60%,_transparent_90%)]"
                  : "bg-[linear-gradient(to_top,_rgba(0,0,0,0.95)_0%,_rgba(0,0,0,0.7)_30%,_rgba(0,0,0,0.4)_60%,_transparent_90%)]"
              } opacity-0 group-hover:opacity-50 transition-opacity duration-300`}
            />
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-10 p-3 pt-6 pointer-events-none">
            <h3 className="font-medium text-white text-md line-clamp-2 transform transition-transform duration-300 origin-left group-hover:scale-[1.1]">
              {item.title}
            </h3>
          </div>

          <button
            className="absolute inset-0 z-20"
            onClick={handleCardClick}
          ></button>
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
