import React, { useCallback, useMemo, useState } from "react";
import { Play } from "lucide-react";
import { Movie } from "@/data/mockMovies";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import { useContent } from "@/hooks/useContent";
import { useChannels } from "@/hooks/useChannels";
import MovieModal from "@/components/MovieModal";
import FullscreenPlayer from "@/components/FullscreenPlayer";

interface MovieCardProps {
  movie: Movie;
  showSaveButton?: boolean;
  showProgress?: boolean;
  progressPercent?: number;
  showResumeButton?: boolean;
  onPlayFullscreen?: (videoUrl: string) => void;
  onOpen?: () => boolean;
}

const MovieCard = React.memo(
  ({
    movie,
    showSaveButton = true,
    showProgress = false,
    progressPercent = 0,
    showResumeButton = false,
    onPlayFullscreen,
    onOpen,
  }: MovieCardProps) => {
    const { favoriteIds, addToFavorites, removeFromFavorites } =
      useUserFavorites();
    const { content } = useContent();
    const { channels } = useChannels();

    const [currentModalMovie, setCurrentModalMovie] = useState<Movie | null>(
      null,
    );
    const [isFullscreen, setIsFullscreen] = useState(false);

    const actualMovie = currentModalMovie || movie;

    const isSaved = useMemo(
      () => favoriteIds.includes(actualMovie.id),
      [favoriteIds, actualMovie.id],
    );
    const contentItem = useMemo(
      () => content.find((item) => item.id === actualMovie.id),
      [content, actualMovie.id],
    );
    const videoUrl = contentItem?.video_url;
    const channel = useMemo(
      () => channels.find((ch) => ch.id === actualMovie.channelId),
      [channels, actualMovie.channelId],
    );

    const handleSave = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isSaved) {
          removeFromFavorites(actualMovie.id);
        } else {
          addToFavorites(actualMovie.id);
        }
      },
      [isSaved, actualMovie.id, addToFavorites, removeFromFavorites],
    );

    const handleCardClick = useCallback(() => {
      if (onOpen && onOpen() === true) return;
      setCurrentModalMovie(actualMovie);
    }, [onOpen, actualMovie]);

    const handleModalPlayClick = useCallback(() => {
      if (contentItem?.video_url) {
        if (onPlayFullscreen) {
          onPlayFullscreen(contentItem.video_url);
          setCurrentModalMovie(null);
        } else {
          setCurrentModalMovie(null);
          setTimeout(() => {
            setIsFullscreen(true);
          }, 200);
        }
      }
    }, [contentItem?.video_url, onPlayFullscreen]);

    const handleExitFullscreen = useCallback(() => {
      setIsFullscreen(false);
    }, []);

    const handleSaveModal = useCallback(() => {
      if (isSaved) {
        removeFromFavorites(actualMovie.id);
      } else {
        addToFavorites(actualMovie.id);
      }
    }, [isSaved, actualMovie.id, addToFavorites, removeFromFavorites]);

    const recommendedContent = useMemo(
      () =>
        content
          .filter(
            (item) =>
              item.id !== actualMovie.id &&
              (item.genre === actualMovie.genre ||
                item.channel_id === actualMovie.channelId),
          )
          .slice(0, 6),
      [content, actualMovie.id, actualMovie.genre, actualMovie.channelId],
    );

    return (
      <>
        {isFullscreen && videoUrl && (
          <FullscreenPlayer
            isOpen={isFullscreen}
            onClose={handleExitFullscreen}
            videoUrl={videoUrl}
            title={actualMovie.title}
          />
        )}

        <div className="movie-card group rounded-lg transition-all duration-300">
          <div
            className="block cursor-pointer rounded-lg"
            onClick={handleCardClick}
          >
            <div
              className="relative overflow-hidden rounded-lg border-2 border-transparent group-hover:scale-105 group-hover:border-white group-hover:shadow-[0_0_4px_rgba(255,255,255,0.6)]
 transition-all duration-300"
              style={{ aspectRatio: "16/9" }}
            >
              <div className="w-full h-full rounded-lg overflow-hidden">
                <img
                  src={actualMovie.posterUrl}
                  alt={actualMovie.title}
                  className="w-full h-full rounded-lg object-cover transform transition-transform duration-300 hover:scale-[1.1]"
                  loading="lazy"
                  decoding="async"
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

              <div className="absolute inset-0 z-0 rounded-lg overflow-hidden pointer-events-none">
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/90 via-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              <div className="absolute bottom-0 left-0 right-0 z-10 p-3 pt-6 pointer-events-none">
                <h3 className="font-medium text-white text-md line-clamp-2 transform transition-transform duration-300 origin-left group-hover:scale-[1.1]">
                  {actualMovie.title}
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

        <MovieModal
          isOpen={!!currentModalMovie && !isFullscreen}
          onClose={() => setCurrentModalMovie(null)}
          movie={actualMovie}
          isSaved={isSaved}
          onSave={handleSaveModal}
          onPlay={handleModalPlayClick}
          videoUrl={videoUrl}
          contentItem={contentItem}
          channel={channel}
          recommendedContent={recommendedContent}
          onOpenRelatedMovie={setCurrentModalMovie}
        />
      </>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.movie.id === nextProps.movie.id &&
      prevProps.showProgress === nextProps.showProgress &&
      prevProps.progressPercent === nextProps.progressPercent &&
      prevProps.showResumeButton === nextProps.showResumeButton
    );
  },
);

MovieCard.displayName = "MovieCard";

export default MovieCard;
