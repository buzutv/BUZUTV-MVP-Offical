import { Play } from "lucide-react";
import { Movie } from "@/data/mockMovies";
import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import { useContent } from "@/hooks/useContent";
import { useChannels } from "@/hooks/useChannels";
import SeriesModal from "@/components/SeriesModal";
import KidsSeriesModal from "@/components/KidsSeriesModal";
import FullscreenPlayer from "@/components/FullscreenPlayer";

interface SeriesCardProps {
  series: Movie;
  showSaveButton?: boolean;
  showProgress?: boolean;
  progressPercent?: number;
  showResumeButton?: boolean;
  onPlayFullscreen?: (videoUrl: string) => void;
  onOpen?: () => boolean;
}

const SeriesCard = ({
  series,
  showSaveButton = true,
  showProgress = false,
  progressPercent = 0,
  showResumeButton = false,
  onPlayFullscreen,
  onOpen,
}: SeriesCardProps) => {
  const location = useLocation();
  const { favoriteIds, addToFavorites, removeFromFavorites } =
    useUserFavorites();
  const { content } = useContent();
  const { channels } = useChannels();

  const [currentSeries, setCurrentSeries] = useState<Movie | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState("");
  const [currentVideoTitle, setCurrentVideoTitle] = useState("");

  const actualSeries = currentSeries || series;
  const isSaved = favoriteIds.includes(actualSeries.id);

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSaved) {
      removeFromFavorites(actualSeries.id);
    } else {
      addToFavorites(actualSeries.id);
    }
  };

  const handleCardClick = () => {
    if (onOpen && onOpen() === true) return;
    setCurrentSeries(actualSeries);
  };

  const handlePlayEpisode = (videoUrl: string, episodeTitle: string) => {
    setCurrentVideoUrl(videoUrl);
    setCurrentVideoTitle(episodeTitle);

    if (onPlayFullscreen) {
      onPlayFullscreen(videoUrl);
      setCurrentSeries(null);
    } else {
      setCurrentSeries(null);
      setTimeout(() => {
        setIsFullscreen(true);
      }, 200);
    }
  };

  const handleExitFullscreen = () => {
    setIsFullscreen(false);
    setCurrentVideoUrl("");
    setCurrentVideoTitle("");
  };

  const handleSaveModal = () => {
    if (isSaved) {
      removeFromFavorites(actualSeries.id);
    } else {
      addToFavorites(actualSeries.id);
    }
  };

  const recommendedContent = content
    .filter(
      (item) =>
        item.id !== actualSeries.id &&
        (item.genre === actualSeries.genre ||
          item.channel_id === actualSeries.channelId),
    )
    .slice(0, 6);

  const contentItem = content.find((item) => item.id === actualSeries.id);
  const videoUrl = contentItem?.video_url;
  const channel = channels.find((ch) => ch.id === actualSeries.channelId);

  return (
    <>
      {isFullscreen && currentVideoUrl && (
        <FullscreenPlayer
          isOpen={isFullscreen}
          onClose={handleExitFullscreen}
          videoUrl={currentVideoUrl}
          title={currentVideoTitle}
        />
      )}

      <div className="series-card movie-card group border-2 border-transparent hover:scale-105 hover:border-white hover:shadow-[0_0_4px_rgba(255,255,255,0.6)] rounded-lg transition-all duration-300 overflow-hidden">
        <div className="block cursor-pointer" onClick={handleCardClick}>
          <div
            className="relative overflow-hidden transition-all duration-300"
            style={{ aspectRatio: "16/9" }}
          >
            <div className="w-full h-full ">
              <img
                src={actualSeries.posterUrl}
                alt={actualSeries.title}
                className="w-full h-full rounded-lg object-cover transform transition-transform duration-300 hover:scale-[1.1]"
              />
            </div>

            {showProgress && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600">
                <div
                  className="h-full bg-red-600 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}

            <div className="absolute inset-0 z-0 rounded-lg  pointer-events-none">
              <div
                className={`absolute bottom-[-1px] left-0 right-0 h-1/2 ${
                  location.pathname === "/kids"
                    ? "bg-[linear-gradient(to_top,_rgba(37,99,235,0.95)_0%,_rgba(37,99,235,0.7)_30%,_rgba(37,99,235,0.4)_60%,_rgba(37,99,235,0.2)_80%,_rgba(37,99,235,0.1)_90%,_transparent_100%)]"
                    : "bg-[linear-gradient(to_top,_rgba(0,0,0,1)_0%,_rgba(0,0,0,0.5)_50%,_transparent_100%)]"
                }`}
              />
              <div
                className={`absolute bottom-[-1px] left-0 right-0 h-1/2 ${
                  location.pathname === "/kids"
                    ? "bg-[linear-gradient(to_top,_rgba(37,99,235,0.95)_0%,_rgba(37,99,235,0.7)_30%,_rgba(37,99,235,0.4)_60%,_transparent_90%)]"
                    : "bg-[linear-gradient(to_top,_rgba(0,0,0,1)_0%,_rgba(0,0,0,0.9)_20%,_rgba(0,0,0,0.5)_50%,_rgba(0,0,0,0.3)_70%,_transparent_90%)]"
                } opacity-0 group-hover:opacity-50 transition-opacity duration-300`}
              />
            </div>

            <div className="absolute bottom-0 left-0 right-0 z-10 p-3 pt-6 pointer-events-none">
              <h3 className="font-medium text-white text-md line-clamp-2 transform transition-transform duration-300 origin-left group-hover:scale-[1.1]">
                {actualSeries.title}
              </h3>
            </div>

            {showResumeButton && (
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <button className="bg-white text-black px-4 py-2 rounded-lg font-semibold flex items-center space-x-2">
                  <Play className="w-4 h-4" />
                  <span>Resume</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {location.pathname === "/kids" ? (
        <KidsSeriesModal
          isOpen={!!currentSeries && !isFullscreen}
          onClose={() => setCurrentSeries(null)}
          series={actualSeries}
          isSaved={isSaved}
          onSave={handleSaveModal}
          onPlayEpisode={handlePlayEpisode}
          videoUrl={videoUrl}
          contentItem={contentItem}
          channel={channel}
          recommendedContent={recommendedContent}
          onOpenRelatedSeries={(item) => setCurrentSeries(item)}
        />
      ) : (
        <SeriesModal
          isOpen={!!currentSeries && !isFullscreen}
          onClose={() => setCurrentSeries(null)}
          series={actualSeries}
          isSaved={isSaved}
          onSave={handleSaveModal}
          onPlayEpisode={handlePlayEpisode}
          videoUrl={videoUrl}
          contentItem={contentItem}
          channel={channel}
          recommendedContent={recommendedContent}
          onOpenRelatedSeries={(item) => setCurrentSeries(item)}
        />
      )}
    </>
  );
};

export default SeriesCard;
