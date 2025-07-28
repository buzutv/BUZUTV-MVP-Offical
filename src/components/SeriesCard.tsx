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

      <div className="series-card movie-card group rounded-lg transition-all duration-300">
        <div
          className="block cursor-pointer rounded-lg"
          onClick={handleCardClick}
        >
          <div
            className="relative overflow-hidden rounded-lg border-2 border-transparent group-hover:scale-105 group-hover:border-white group-hover:shadow-[0_0_4px_rgba(255,255,255,0.6)] transition-all duration-300"
            style={{ aspectRatio: "16/9" }}
          >
            <div className="w-full h-full rounded-lg overflow-hidden">
              <img
                src={actualSeries.posterUrl}
                alt={actualSeries.title}
                className="w-full h-full rounded-lg object-cover transform transition-transform duration-300 group-hover:scale-[1.1]"
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
                className={`absolute bottom-[-1px] left-0 right-0 h-1/2 ${location.pathname === "/kids" ? "bg-gradient-to-t from-blue-400 via-blue-400/30 to-transparent" : "bg-gradient-to-t from-black/95 via-black/70 to-transparent"}`}
              />
              <div
                className={`absolute bottom-[-1px] left-0 right-0 h-1/2 ${location.pathname === "/kids" ? "bg-gradient-to-t from-blue-400 via-blue-400/50 to-transparent" : "bg-gradient-to-t from-black/90 via-black/70 to-transparent"} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
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
