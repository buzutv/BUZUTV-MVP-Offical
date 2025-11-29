import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { getYouTubeEmbedUrl } from "@/utils/youtubeUtils";
import { supabase } from "../integrations/supabase/client";

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
  const currentVideoIdRef = useRef<string | null>(null); // Track current video ID

  const [isPlaying, setIsPlaying] = useState(false);
  // Remove currentTime state if not used for UI rendering to improve performance
  const [duration, setDuration] = useState(0);
  const [movies, setMovies] = useState<any[]>([]);
  const [lastPausedTime, setLastPausedTime] = useState<number | null>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [videoRestricted, setVideoRestricted] = useState(false);

  // Refs to hold latest values for callbacks to avoid dependency cycles
  const moviesRef = useRef(movies);
  const durationRef = useRef(duration);
  
  // Sync refs with state
  useEffect(() => {
    moviesRef.current = movies;
    durationRef.current = duration;
  }, [movies, duration]);

  // Fetch movie data from Supabase
  useEffect(() => {
    async function fetchMovies() {
      const { data, error } = await supabase
        .from("content")
        .select("*")
        .eq("video_url", videoUrl);

      if (error) {
        console.error("Error fetching movies:", error);
      } else {
        setMovies(data || []);
      }
    }

    if (videoUrl) {
      fetchMovies();
      // Reset duration and lastPausedTime when URL changes
      setDuration(0);
      setLastPausedTime(null);
    }
  }, [videoUrl]);

  // Fetch last paused time and check if completed
  useEffect(() => {
    if (!isOpen || !videoUrl) return;

    async function fetchWatchHistory() {
      if (movies.length === 0) return;

      try {
        const { data, error } = await supabase
          .from("user_watch_history")
          .select("last_position, completed")
          .eq("user_id", userId)
          .eq("movie_id", movies[0]?.id)
          .single();

        if (error || !data) {
          setLastPausedTime(0);
        } else {
          // If completed, start over, otherwise resume
          setLastPausedTime(data.completed ? 0 : (data.last_position || 0));
        }
      } catch (err) {
        console.error("Error fetching watch history:", err);
        setLastPausedTime(0);
      }
    }

    fetchWatchHistory();
  }, [movies, isOpen, videoUrl, userId]);

  // Countdown timer when video ends
  useEffect(() => {
    if (videoEnded && hasNext && playlistInfo?.autoPlay && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (countdown === 0 && videoEnded && hasNext && playlistInfo?.autoPlay) {
      onVideoEnd?.();
      setCountdown(5);
    }
  }, [videoEnded, countdown, hasNext, playlistInfo?.autoPlay, onVideoEnd]);

  // Save watch history helper - strictly internal logic, no dependency issues via refs
  const saveWatchHistory = useCallback(async (pausedAt: number, completed: boolean = false) => {
    const currentMovies = moviesRef.current;
    const currentDuration = durationRef.current;

    if (!currentMovies[0]?.id) return;

    try {
      await supabase
        .from("user_watch_history")
        .upsert(
          {
            user_id: userId,
            movie_id: currentMovies[0]?.id,
            watched_at: new Date().toISOString(),
            last_position: Math.floor(pausedAt),
            watch_duration: Math.floor(currentDuration),
            watch_percentage: currentDuration > 0 ? Math.floor((pausedAt / currentDuration) * 100) : 0,
            total_duration: Math.floor(currentDuration),
            completed: completed || (currentDuration > 0 && pausedAt >= currentDuration - 5), // leeway
          },
          { onConflict: "user_id,movie_id" }
        );
    } catch (err) {
      console.error("Error saving watch history:", err);
    }
  }, [userId]);

  // 🎮 Controls
  const handlePlayPause = useCallback(async () => {
    const player = playerInstanceRef.current;
    if (!player || typeof player.getCurrentTime !== 'function') return;

    if (isPlaying) {
      player.pauseVideo();
      const pausedAt = player.getCurrentTime();
      await saveWatchHistory(pausedAt, false);
    } else {
      player.playVideo();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, saveWatchHistory]);

  // 🔒 Escape + scroll lock + keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose?.();
      } else if (event.key === "ArrowRight" && hasNext && onNext) {
        onNext();
      } else if (event.key === "ArrowLeft" && hasPrevious && onPrevious) {
        onPrevious();
      } else if (event.key === " " || event.key === "k") {
        event.preventDefault();
        await handlePlayPause();
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
  }, [isOpen, onClose, hasNext, hasPrevious, onNext, onPrevious, handlePlayPause]);

  // 🎥 Initialize YouTube player
  useEffect(() => {
    // Only proceed if we have valid data
    if (!isOpen || !videoUrl || lastPausedTime === null) return;

    const embedUrl = getYouTubeEmbedUrl(videoUrl);
    const videoIdMatch = embedUrl?.match(/embed\/([^?]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    if (!videoId) return;

    // Load Youtube API if needed
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }

    const initPlayer = () => {
      // FIX: Prevent reloading if the player exists and the video ID is the same
      if (playerInstanceRef.current) {
        if (currentVideoIdRef.current !== videoId) {
           currentVideoIdRef.current = videoId;
           playerInstanceRef.current.loadVideoById(videoId);
           // Manually seek since loadVideoById might not support startSeconds perfectly in all contexts
           if (lastPausedTime > 0) {
             // Small timeout to ensure video is loaded before seeking
             setTimeout(() => {
               try { playerInstanceRef.current?.seekTo(lastPausedTime, true); } catch(e) {}
             }, 100);
           }
        }
        setVideoEnded(false);
        setVideoRestricted(false);
        setCountdown(5);
        return;
      }

      currentVideoIdRef.current = videoId;

      playerInstanceRef.current = new window.YT.Player(
        playerContainerRef.current,
        {
          videoId,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 1,
            controls: 1,
            rel: 0,
            playsinline: 1,
            // start: lastPausedTime // Option A: Pass start time here
          },
          events: {
            onReady: (e: any) => {
              // Option B: Seek on ready
              if (lastPausedTime > 0) {
                e.target.seekTo(lastPausedTime, true);
              }
              e.target.playVideo();
              setIsPlaying(true);
              const dur = e.target.getDuration();
              if (dur) setDuration(dur);
            },
            onStateChange: async (e: any) => {
              const player = e.target;
              
              if (e.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                const dur = player.getDuration();
                if (dur) setDuration(dur);
                setVideoEnded(false);
              }
              
              if (e.data === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false);
                saveWatchHistory(player.getCurrentTime(), false);
              }

              if (e.data === window.YT.PlayerState.ENDED) {
                setIsPlaying(false);
                setVideoEnded(true);
                saveWatchHistory(player.getCurrentTime(), true);
              }
            },
            onError: (e: any) => {
              if ([100, 101, 150].includes(e.data)) {
                setVideoRestricted(true);
                if (hasNext && onNext) {
                  setTimeout(() => onNext(), 2000);
                }
              }
            },
          },
        }
      );
    };

    if (window.YT && window.YT.Player) {
        initPlayer();
    } else {
        (window as any).onYouTubeIframeAPIReady = initPlayer;
    }

  // DEPENDENCY FIX: Removed 'saveWatchHistory' to prevent loop
  }, [isOpen, videoUrl, lastPausedTime, hasNext, onNext]); 

  // Clean up player on unmount
  useEffect(() => {
    return () => {
      if (playerInstanceRef.current && typeof playerInstanceRef.current.destroy === 'function') {
        playerInstanceRef.current.destroy();
        playerInstanceRef.current = null;
        currentVideoIdRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-6 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <h2 className="text-white text-2xl font-bold">{title}</h2>
          {playlistInfo && (
            <div className="text-white/70 text-sm flex items-center gap-2">
              <span>
                {playlistInfo.current} of {playlistInfo.total}
              </span>
              {playlistInfo.autoPlay && (
                <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs">
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
              className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition"
            >
              <SkipBack />
            </button>
          )}
          {hasNext && onNext && (
            <button
              onClick={onNext}
              className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition"
            >
              <SkipForward />
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="ml-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition"
        >
          <X />
        </button>
      </div>

      {/* Player */}
      <div
        ref={playerContainerRef}
        className="w-full h-full"
      />

      {/* Overlays */}
      {videoRestricted && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-40">
          <div className="text-center">
            <div className="text-white text-2xl mb-4">
              This video is restricted or unavailable
            </div>
            {hasNext && (
              <div className="text-white/70">
                Skipping to next video...
              </div>
            )}
          </div>
        </div>
      )}

      {videoEnded && hasNext && playlistInfo?.autoPlay && !videoRestricted && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-40">
          <div className="text-center">
            <div className="text-white text-6xl font-bold mb-4 animate-pulse">
              {countdown}
            </div>
            <div className="text-white text-2xl mb-2">
              Playing next video...
            </div>
            <div className="text-white/70">
              {playlistInfo.current + 1} of {playlistInfo.total}
            </div>
            <button
              onClick={() => {
                setCountdown(0);
                onVideoEnd?.();
              }}
              className="mt-6 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition"
            >
              Play Now
            </button>
          </div>
        </div>
      )}

      {/* Keyboard hints */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/60 text-sm">
        Space Play/Pause • ←/→ Navigate • Esc Close
      </div>
    </div>,
    document.body
  );
};

export default FullscreenPlayer;