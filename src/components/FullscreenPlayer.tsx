import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { getYouTubeEmbedUrl } from "@/utils/youtubeUtils";
import { supabase } from "../integrations/supabase/client";
import { getLastPausedTime } from "@/utils/youtubeUtils";

interface FullscreenPlayerProps {
  isOpen: boolean;
  onClose?: () => void;
  videoUrl: string;
  title: string;
  userId: string;
  // Playlist props
  onVideoEnd?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  playlistInfo?: {
    current: number;
    total: number;
    autoPlay: boolean;
  };
}

const FullscreenPlayer = ({
  isOpen,
  onClose,
  videoUrl,
  title,
  userId,
  onVideoEnd,
  hasNext = false,
  hasPrevious = false,
  onNext,
  onPrevious,
  playlistInfo,
}: FullscreenPlayerProps) => {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [movies, setMovies] = useState<any[]>([]);
  const [lastPausedTime, setLastPausedTime] = useState<number | null>(null);
  const [videoEnded, setVideoEnded] = useState(false);

  // Fetch movie data from Supabase
  useEffect(() => {
    async function fetchMovies() {
      const { data, error } = await supabase
        .from("content")
        .select("*")
        .eq("video_url", videoUrl);

      console.log("Fetched Movie", data);
      if (error) {
        console.error("Error fetching movies:", error);
      } else {
        console.log("Fetched movies:", data);
        setMovies(data || []);
      }
    }

    if (videoUrl) {
      fetchMovies();
    }
  }, [videoUrl]);

  // Fetch last paused time
  useEffect(() => {
    if (!isOpen || !videoUrl) return;

    async function fetchLastPausedTime() {
      if (movies.length === 0) return;
      const lastPaused = await getLastPausedTime(movies[0]?.id, userId);
      setLastPausedTime(lastPaused);
    }

    fetchLastPausedTime();
  }, [movies, isOpen, videoUrl, userId]);

  console.log("Last paused time in FullscreenPlayer:", lastPausedTime);

  // 🔒 Escape + scroll lock + keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose?.();
      } else if (event.key === "ArrowRight" && hasNext && onNext) {
        onNext();
      } else if (event.key === "ArrowLeft" && hasPrevious && onPrevious) {
        onPrevious();
      } else if (event.key === " " || event.key === "k") {
        event.preventDefault();
        handlePlayPause();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, hasNext, hasPrevious, onNext, onPrevious]);

  // 🎥 Initialize YouTube player
  useEffect(() => {
    if (!isOpen || !videoUrl || lastPausedTime === null) return;

    const embedUrl = getYouTubeEmbedUrl(videoUrl);
    const videoIdMatch = embedUrl?.match(/embed\/([^?]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;
    if (!videoId) return;

    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }

    const createPlayer = () => {
      if (playerInstanceRef.current) {
        playerInstanceRef.current.loadVideoById(videoId);
        setVideoEnded(false);
        return;
      }

      playerInstanceRef.current = new window.YT.Player(
        playerContainerRef.current,
        {
          videoId,
          width: "100%",
          height: "100%",
          playerVars: { autoplay: 1, controls: 0, rel: 0, playsinline: 1 },
          events: {
            onReady: async (e: any) => {
              // Seek to last paused time if available
              if (lastPausedTime && lastPausedTime > 0) {
                e.target.seekTo(lastPausedTime, true);
              }
              e.target.playVideo();
              setIsPlaying(true);
              setDuration(e.target.getDuration());
            },
            onStateChange: (e: any) => {
              const player = e.target;
              if (e.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                setDuration(player.getDuration());
                setVideoEnded(false);
              }
              if (e.data === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false);
              }
              // Video ended - trigger autoplay
              if (e.data === window.YT.PlayerState.ENDED) {
                setIsPlaying(false);
                setVideoEnded(true);
                
                // Save completion to watch history
                saveWatchHistory(player.getCurrentTime(), true);
                
                // Trigger autoplay callback
                if (onVideoEnd) {
                  setTimeout(() => {
                    onVideoEnd();
                  }, 1000); // Small delay before next video
                }
              }
            },
          },
        }
      );
    };

    if (window.YT && window.YT.Player) createPlayer();
    else (window as any).onYouTubeIframeAPIReady = createPlayer;

    // Update progress every 500ms
    const interval = setInterval(() => {
      if (playerInstanceRef.current) {
        setCurrentTime(playerInstanceRef.current.getCurrentTime());
      }
    }, 500);

    return () => {
      clearInterval(interval);
      if (playerInstanceRef.current) {
        playerInstanceRef.current.destroy();
        playerInstanceRef.current = null;
      }
    };
  }, [isOpen, videoUrl, userId, lastPausedTime]);

  // Save watch history helper
  const saveWatchHistory = async (pausedAt: number, completed: boolean = false) => {
    if (!movies[0]?.id) return;

    try {
      const { data, error } = await supabase
        .from("user_watch_history")
        .upsert(
          {
            user_id: userId,
            movie_id: movies[0]?.id,
            watched_at: new Date(),
            last_position: Math.floor(pausedAt),
            watch_duration: Math.floor(duration),
            watch_percentage: Math.floor((pausedAt / duration) * 100),
            total_duration: Math.floor(duration),
            completed: completed || pausedAt >= duration,
          },
          { onConflict: ["user_id", "movie_id"] }
        );

      if (error) console.error("Supabase insert error:", error);
      else console.log("Inserted watch history:", data);
    } catch (err) {
      console.error("Error saving watch history:", err);
    }
  };

  // 🎮 Controls
  const handlePlayPause = async () => {
    const player = playerInstanceRef.current;
    if (!player) return;

    console.log("Who the heck are you", player);
    if (!player || !("getCurrentTime" in player)) {
      console.warn("Player not ready yet");
      return;
    }

    if (isPlaying) {
      // --- USER IS PAUSING VIDEO ---
      player.pauseVideo();
      const pausedAt = player.getCurrentTime();
      console.log("Paused at:", pausedAt);
      await saveWatchHistory(pausedAt);
    } else {
      // --- USER IS PLAYING VIDEO ---
      player.playVideo();
    }

    setIsPlaying(!isPlaying);
  };

  const handleMute = () => {
    const player = playerInstanceRef.current;
    if (!player) return;
    isMuted ? player.unMute() : player.mute();
    setIsMuted(!isMuted);
  };

  const handleSeek = (seconds: number) => {
    const player = playerInstanceRef.current;
    if (!player) return;
    const newTime = Math.max(0, currentTime + seconds);
    player.seekTo(newTime, true);
    setCurrentTime(newTime);
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const player = playerInstanceRef.current;
    if (!player) return;
    const newTime = parseFloat(e.target.value);
    player.seekTo(newTime, true);
    setCurrentTime(newTime);
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black"
      style={{ zIndex: 999999, transform: "translateZ(0)", isolation: "isolate" }}
    >
      <div className="relative w-full h-full">
        {/* Header with title and playlist info */}
        <div className="absolute top-0 left-0 right-0 z-[1000000] bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-white text-lg font-semibold">{title}</h2>
              {playlistInfo && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-white/70 text-sm">
                    {playlistInfo.current} of {playlistInfo.total}
                  </span>
                  {playlistInfo.autoPlay && (
                    <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">
                      AutoPlay ON
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Playlist navigation */}
            <div className="flex items-center gap-2">
              {hasPrevious && onPrevious && (
                <button
                  onClick={onPrevious}
                  className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition"
                  title="Previous (←)"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
              )}

              {hasNext && onNext && (
                <button
                  onClick={onNext}
                  className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition"
                  title="Next (→)"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={onClose}
                className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Player */}
        <div ref={playerContainerRef} className="w-full h-full" />

        {/* Video ended overlay */}
        {videoEnded && hasNext && playlistInfo?.autoPlay && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-[999999]">
            <div className="bg-black/80 text-white p-6 rounded-lg text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-lg">Playing next video...</p>
              <p className="text-sm text-white/70 mt-2">
                {playlistInfo.current + 1} of {playlistInfo.total}
              </p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-4 z-[1000000]">
          <button
            onClick={() => handleSeek(-10)}
            className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
          <button
            onClick={handlePlayPause}
            className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>
          <button
            onClick={() => handleSeek(10)}
            className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition"
          >
            <RotateCw className="w-6 h-6" />
          </button>
          <button
            onClick={handleMute}
            className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition"
          >
            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-3/4 flex items-center gap-2 z-[1000000]">
          <span className="text-white text-sm">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            step={0.1}
            onChange={handleScrub}
            className="flex-1 h-1 rounded-lg accent-red-600 cursor-pointer"
          />
          <span className="text-white text-sm">{formatTime(duration)}</span>
        </div>

        {/* Keyboard hints */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000000]">
          <div className="bg-black/60 text-white text-xs px-4 py-2 rounded-full backdrop-blur-sm">
            <kbd className="px-1.5 py-0.5 bg-white/20 rounded mx-1">Space</kbd> Play/Pause •
            <kbd className="px-1.5 py-0.5 bg-white/20 rounded mx-1">←</kbd>/
            <kbd className="px-1.5 py-0.5 bg-white/20 rounded mx-1">→</kbd> Navigate •
            <kbd className="px-1.5 py-0.5 bg-white/20 rounded mx-1">Esc</kbd> Close
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Helper to format seconds → mm:ss
function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default FullscreenPlayer;