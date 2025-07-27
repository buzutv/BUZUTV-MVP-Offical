import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface Episode {
  id: string;
  title: string;
  episode_number: number;
  duration_minutes?: number;
  description?: string;
  video_url?: string;
}

interface Season {
  season_number: number;
  episodes: Episode[];
}

interface SeriesPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  seriesTitle: string;
  seasons: Season[];
  currentEpisode: Episode;
  currentSeason: number;
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

const SeriesPlayer: React.FC<SeriesPlayerProps> = ({
  isOpen,
  onClose,
  seriesTitle,
  seasons,
  currentEpisode,
  currentSeason,
}) => {
  const [playingEpisode, setPlayingEpisode] = useState(currentEpisode);
  const [playingSeason, setPlayingSeason] = useState(currentSeason);

  // Update playing episode when currentEpisode changes
  useEffect(() => {
    setPlayingEpisode(currentEpisode);
    setPlayingSeason(currentSeason);
  }, [currentEpisode, currentSeason]);

  // Handle body scroll prevention when player is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Find current season data
  const currentSeasonData = seasons.find(
    (s) => s.season_number === playingSeason,
  );
  const currentEpisodeIndex =
    currentSeasonData?.episodes.findIndex(
      (ep) => ep.id === playingEpisode.id,
    ) ?? -1;

  // Navigation logic
  const getPreviousEpisode = () => {
    if (!currentSeasonData) return null;

    if (currentEpisodeIndex > 0) {
      // Previous episode in same season
      return {
        episode: currentSeasonData.episodes[currentEpisodeIndex - 1],
        season: playingSeason,
      };
    } else {
      // Last episode of previous season
      const previousSeasonData = seasons.find(
        (s) => s.season_number === playingSeason - 1,
      );
      if (previousSeasonData && previousSeasonData.episodes.length > 0) {
        return {
          episode:
            previousSeasonData.episodes[previousSeasonData.episodes.length - 1],
          season: playingSeason - 1,
        };
      }
    }
    return null;
  };

  const getNextEpisode = () => {
    if (!currentSeasonData) return null;

    if (currentEpisodeIndex < currentSeasonData.episodes.length - 1) {
      // Next episode in same season
      return {
        episode: currentSeasonData.episodes[currentEpisodeIndex + 1],
        season: playingSeason,
      };
    } else {
      // First episode of next season
      const nextSeasonData = seasons.find(
        (s) => s.season_number === playingSeason + 1,
      );
      if (nextSeasonData && nextSeasonData.episodes.length > 0) {
        return {
          episode: nextSeasonData.episodes[0],
          season: playingSeason + 1,
        };
      }
    }
    return null;
  };

  const previousEpisode = getPreviousEpisode();
  const nextEpisode = getNextEpisode();

  const handlePreviousEpisode = () => {
    if (previousEpisode) {
      setPlayingEpisode(previousEpisode.episode);
      setPlayingSeason(previousEpisode.season);
    }
  };

  const handleNextEpisode = () => {
    if (nextEpisode) {
      setPlayingEpisode(nextEpisode.episode);
      setPlayingSeason(nextEpisode.season);
    }
  };

  const embedUrl = playingEpisode.video_url
    ? getYouTubeEmbedUrl(playingEpisode.video_url) || playingEpisode.video_url
    : null;

  if (!isOpen) return null;

  const playerContent = (
    <div className="fixed inset-0 z-[99999] bg-black flex flex-col">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-[100000] bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Video Player */}
      <div className="flex-1 flex items-center justify-center">
        {embedUrl ? (
          embedUrl.includes("youtube.com/embed") ? (
            <iframe
              key={playingEpisode.id} // Force re-render when episode changes
              src={`${embedUrl}?autoplay=1&controls=1&rel=0&fs=1&playsinline=1`}
              className="w-full h-full"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          ) : (
            <video
              key={playingEpisode.id}
              src={embedUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          )
        ) : (
          <div className="text-white text-xl">
            No video available for this episode
          </div>
        )}
      </div>

      {/* Episode Navigation Bar */}
      <div className="bg-black/90 backdrop-blur-sm border-t border-black px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          {/* Episode Info */}
          <div className="flex-1">
            <h2 className="text-white text-lg font-semibold mb-1">
              {seriesTitle}
            </h2>
            <p className="text-gray-300 text-sm">
              Season {playingSeason} • Episode {playingEpisode.episode_number}
              {playingEpisode.title && ` • ${playingEpisode.title}`}
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-4">
            {/* Previous Episode */}
            <button
              onClick={handlePreviousEpisode}
              disabled={!previousEpisode}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                previousEpisode
                  ? "bg-white/10 hover:bg-white/20 text-white"
                  : "bg-gray-600 text-gray-400 cursor-not-allowed"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm">
                {previousEpisode ? (
                  <>
                    S{previousEpisode.season}E
                    {previousEpisode.episode.episode_number}
                  </>
                ) : (
                  "Previous"
                )}
              </span>
            </button>

            {/* Next Episode */}
            <button
              onClick={handleNextEpisode}
              disabled={!nextEpisode}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                nextEpisode
                  ? "bg-white/10 hover:bg-white/20 text-white"
                  : "bg-gray-600 text-gray-400 cursor-not-allowed"
              }`}
            >
              <span className="text-sm">
                {nextEpisode ? (
                  <>
                    S{nextEpisode.season}E{nextEpisode.episode.episode_number}
                  </>
                ) : (
                  "Next"
                )}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render in a portal to ensure it's always at the root level, above any modals
  return createPortal(playerContent, document.body);
};

export default SeriesPlayer;
