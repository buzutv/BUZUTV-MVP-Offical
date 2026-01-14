import React, { useEffect, useImperativeHandle, forwardRef, useRef, useState, memo, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getYouTubeEmbedUrl, normalizer, onReadyVideoLoader, saveWatchHistory } from "@/utils/youtubeUtils";
import { useDispatch, useSelector } from "react-redux";
import { openScreenPlayer, setCurrentVideoIndex } from "@/store/screenPlayerSlice";

interface VideoPlayerProps {
  videoId: string;
  setActualVideoUrl?: (videoId: string) => void;
  setCurrentMovie?: (movie: any) => void;
  playlistItems?: any;
  movieId: string;
  episodeId: string;
  type: string;
  playlistInfo?: any;
  userid: string;
  setFinal?: (any: any) => void;
  onProgressUpdate?: (data: { id: string, watch_percentage: number, last_position: number }) => void;
}

const VideoPlayer = forwardRef<any, VideoPlayerProps>(
  ({ videoId, playlistItems, setCurrentMovie, movieId, episodeId, setFinal, type, userid, playlistInfo, onProgressUpdate }, ref) => {
    const playerContainerRef = useRef<HTMLDivElement>(null);
    const playerInstanceRef = useRef<any>(null);

    // Refs for props to avoid stale closures
    const movieIdRef = useRef(movieId);
    const episodeIdRef = useRef(episodeId);
    const videoIdRef = useRef(videoId);
    const countdownRef = useRef<any>(null);
    const isCountdownStartedRef = useRef(false);

    // Redux State
    const selectedVideo = useSelector((state: any) => state.screenPlayer.selectedVideo);
    const selectedVideoRef = useRef(selectedVideo);
    const playlistFullObject = useSelector((state: any) => state?.screenPlayer?.playlistInfo) || {};
    const episodes = useSelector((state: any) => state?.screenPlayer?.seriesData?.episodes) || [];
    const isSeries = useSelector((state: any) => state?.screenPlayer?.isSeries) || false;
    const currentVideoIndex = useSelector((state: any) => state?.screenPlayer?.currentVideoIndex) || 0;

    const [countdown, setCountdown] = useState(5);
    const [videoEnded, setVideoEnded] = useState(false);
    const [videoRestricted, setVideoRestricted] = useState(false);

    const dispatch = useDispatch();

    // Playlist items from Redux
    const playlist_items = playlistFullObject[0]?.playlist_items || [];

    // Determine current queue based on content type
    const currentQueue = isSeries ? episodes : playlist_items;

    const hasNextVideo = currentVideoIndex < currentQueue.length - 1;

    console.log("VideoPlayer State:", {
      isSeries,
      episodesCount: episodes.length,
      playlistItemsCount: playlist_items.length,
      currentVideoIndex,
      videoId
    });

    // --- SYNC REFS ---
    useEffect(() => {
      movieIdRef.current = movieId;
    }, [movieId]);

    useEffect(() => {
      episodeIdRef.current = episodeId;
    }, [episodeId]);

    useEffect(() => {
      videoIdRef.current = videoId;
      isCountdownStartedRef.current = false; // Reset when video changes
    }, [videoId]);

    useEffect(() => {
      selectedVideoRef.current = selectedVideo;
    }, [selectedVideo]);

    // --- EXPOSE METHODS VIA REF ---
    useImperativeHandle(ref, () => ({
      play: () => playerInstanceRef.current?.playVideo(),
      pause: () => playerInstanceRef.current?.pauseVideo(),
      getDuration: () => playerInstanceRef.current?.getDuration(),
      saveProgress: async () => {
        if (playerInstanceRef.current && playerInstanceRef.current.getCurrentTime) {
          await saveWatchHistory(
            userid,
            movieIdRef.current,
            episodeIdRef.current,
            videoIdRef.current,
            playerInstanceRef.current.getCurrentTime(),
            false,
            playerInstanceRef,
            type
          );
        }
      }
    }));

    // --- ID EXTRACTION ---
    const getVideoId = useCallback((inputVideoId: string) => {
      if (!inputVideoId) return null;
      try {
        if (!inputVideoId.includes("/")) return inputVideoId;
        const embedUrl = getYouTubeEmbedUrl(inputVideoId);
        const videoIdMatch = embedUrl?.match(/embed\/([^?]+)/);
        return videoIdMatch ? videoIdMatch[1] : null;
      } catch (e) {
        return null;
      }
    }, []);

    // --- RESUME LOGIC ---
    const getResumePosition = useCallback(() => {
      const currentVidData = selectedVideoRef.current;
      if (!currentVidData) return 0;

      const history = Array.isArray(currentVidData.user_watch_history)
        ? currentVidData.user_watch_history[0]
        : currentVidData.user_watch_history;

      const isCompleted = currentVidData.completed || history?.completed;
      const watchPct = currentVidData.watch_percentage || history?.watch_percentage || 0;
      const lastPos = currentVidData.last_position || history?.last_position || 0;

      console.log("Resuming logic calculated position:", { isCompleted, watchPct, lastPos });

      if (isCompleted || watchPct >= 99) {
        return 0;
      } else if (lastPos > 0) {
        return lastPos;
      }
      return 0;
    }, []);

    const resumeVideoPosition = (player: any) => {
      const startSeconds = getResumePosition();
      console.log("Resuming to position:", startSeconds);
      player.seekTo(startSeconds, true);
      player.playVideo();
    };

    // --- INITIALIZE & UPDATE PLAYER ---
    useEffect(() => {
      if (!videoId) return;

      setVideoRestricted(false);
      const vid = getVideoId(videoId);

      if (!vid) {
        console.warn("VideoPlayer: Invalid video ID", videoId);
        return;
      }

      const startPos = getResumePosition();

      // If player exists, load new video
      if (playerInstanceRef.current) {
        try {
          console.log("Loading video:", vid, "at position:", startPos);
          playerInstanceRef.current.loadVideoById({
            videoId: vid,
            startSeconds: startPos
          });
        } catch (e) {
          console.error("Error loading video", e);
        }
        return;
      }

      // Initialize YouTube API if not loaded
      if (!window.YT) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
      }

      const initPlayer = () => {
        if (playerInstanceRef.current) return;

        console.log("Initializing YouTube Player:", vid, "starting at:", startPos);

        playerInstanceRef.current = new window.YT.Player(playerContainerRef.current, {
          height: "100%",
          width: "100%",
          videoId: vid,
          playerVars: {
            autoplay: 1,
            controls: 1,
            rel: 0,
            showinfo: 0,
            modestbranding: 1,
            start: Math.floor(startPos)
          },
          events: {
            onReady: (e: any) => {
              // We use start parameter in playerVars, but seekTo as a fallback/reinforcement
              e.target.playVideo();
            },
            onStateChange: handlePlayerStateChange,
            onError: handlePlayerError,
          },
        });
      };

      if (window.YT && window.YT.Player) {
        initPlayer();
      } else {
        (window as any).onYouTubeIframeAPIReady = initPlayer;
      }
    }, [videoId, getVideoId, userid, getResumePosition]);

    // --- EARLY COUNTDOWN POLLING ---
    useEffect(() => {
      const checkThreshold = setInterval(() => {
        if (
          playerInstanceRef.current &&
          playerInstanceRef.current.getPlayerState() === window.YT.PlayerState.PLAYING &&
          hasNextVideo &&
          !isCountdownStartedRef.current
        ) {
          const currentTime = playerInstanceRef.current.getCurrentTime();
          const duration = playerInstanceRef.current.getDuration();

          if (duration > 0 && duration - currentTime <= 20) {
            console.log("Starting early countdown (20s remaining, 5s duration)");
            startCountdown(5);
          }
        }
      }, 1000);

      return () => clearInterval(checkThreshold);
    }, [hasNextVideo]);

    // --- COUNTDOWN HELPERS ---
    const clearCountdownTimer = () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };

    const startCountdown = (initialValue: number = 5) => {
      if (isCountdownStartedRef.current) return;

      clearCountdownTimer();
      setVideoEnded(true);
      setCountdown(initialValue);
      isCountdownStartedRef.current = true;

      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearCountdownTimer();
            setVideoEnded(false);
            // Use setTimeout to avoid calling playNext inside setState
            setTimeout(() => playNext(), 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    };

    const handleReplay = () => {
      setVideoEnded(false);
      setCountdown(5); // Reset for next time
      playerInstanceRef.current?.seekTo(0);
      playerInstanceRef.current?.playVideo();
    };

    // --- NAVIGATION ---
    const playNext = () => {
      if (!currentQueue || currentQueue.length === 0) return;

      const nextIndex = currentVideoIndex + 1;

      if (nextIndex >= currentQueue.length) {
        console.log("End of queue reached");
        return;
      }

      clearCountdownTimer();
      setVideoEnded(false);
      setVideoRestricted(false);

      // Get next item from queue
      const nextItem = currentQueue[nextIndex];

      // For series: episode object directly has video_url
      // For playlist: need to access .content
      const nextVideoData = isSeries ? nextItem : nextItem?.content;

      if (!nextVideoData) {
        console.error("No video data found for next item");
        return;
      }

      console.log("Playing next:", { nextIndex, nextVideoData, isSeries });

      // Update Redux with new video
      dispatch(openScreenPlayer({
        isOpen: true,
        currentVideoIndex: nextIndex,
        selectedVideo: nextVideoData,
        isSeries: isSeries,
        seriesData: isSeries ? { episodes } : undefined,
      }));

      if (setCurrentMovie) {
        setCurrentMovie(nextVideoData);
      }
    };

    const playPrevious = () => {
      if (!currentQueue || currentVideoIndex <= 0) return;

      clearCountdownTimer();
      setVideoEnded(false);
      setVideoRestricted(false);

      const prevIndex = currentVideoIndex - 1;
      const prevItem = currentQueue[prevIndex];
      const prevVideoData = isSeries ? prevItem : prevItem?.content;

      if (!prevVideoData) {
        console.error("No video data found for previous item");
        return;
      }

      console.log("Playing previous:", { prevIndex, prevVideoData });

      dispatch(openScreenPlayer({
        isOpen: true,
        currentVideoIndex: prevIndex,
        selectedVideo: prevVideoData,
        isSeries: isSeries,
        seriesData: isSeries ? { episodes } : undefined,
      }));

      if (setCurrentMovie) {
        setCurrentMovie(prevVideoData);
      }
    };

    // --- EVENT HANDLERS ---
    const handlePlayerStateChange = async (e: any) => {
      const state = e.data;

      if (state === window.YT.PlayerState.ENDED) {
        // Save watch history
        await saveWatchHistory(
          userid,
          movieIdRef.current,
          episodeIdRef.current,
          videoIdRef.current,
          e.target.getCurrentTime(),
          true,
          playerInstanceRef,
          type
        );

        // Check if there's a next video
        if (currentVideoIndex < currentQueue.length - 1) {
          startCountdown();
        } else {
          console.log("End of content reached");
          setVideoEnded(true);
          setCountdown(0); // 0 indicates end of playlist/single video
        }
      }

      if (state === window.YT.PlayerState.PAUSED) {
        await saveWatchHistory(
          userid,
          movieIdRef.current,
          episodeIdRef.current,
          videoIdRef.current,
          e.target.getCurrentTime(),
          false,
          playerInstanceRef,
          type
        );
        if (onProgressUpdate) {
          const currentTime = e.target.getCurrentTime();
          const duration = e.target.getDuration();
          const percentage = duration > 0 ? (currentTime / duration) * 100 : 0;
          onProgressUpdate({
            id: episodeIdRef.current || movieIdRef.current,
            watch_percentage: percentage,
            last_position: currentTime
          });
        }
      }

      if (state === window.YT.PlayerState.BUFFERING) {
        const currentTime = e.target.getCurrentTime();
        if (currentTime > 1) {
          if (setFinal) setFinal(currentTime);
          await saveWatchHistory(
            userid,
            movieIdRef.current,
            episodeIdRef.current,
            videoIdRef.current,
            currentTime,
            false,
            playerInstanceRef,
            type
          );
          if (onProgressUpdate) {
            const duration = e.target.getDuration();
            const percentage = duration > 0 ? (currentTime / duration) * 100 : 0;
            onProgressUpdate({
              id: episodeIdRef.current || movieIdRef.current,
              watch_percentage: percentage,
              last_position: currentTime
            });
          }
        }
      }
    };

    const handlePlayerError = (err: any) => {
      console.error("YouTube Player Error:", err.data);

      if (err.data === 150 || err.data === 101) {
        setVideoRestricted(true);

        if (currentVideoIndex < currentQueue.length - 1) {
          startCountdown();
        }
      }
    };

    // --- CLEANUP ---
    useEffect(() => {
      return () => {
        if (playerInstanceRef.current) {
          try {
            playerInstanceRef.current.destroy();
          } catch (e) {
            console.error("Error destroying player", e);
          }
          playerInstanceRef.current = null;
        }
        clearCountdownTimer();
      };
    }, []);

    const hasPreviousVideo = currentVideoIndex > 0;
    const hasPlaylist = currentQueue.length > 1;

    return (
      <div className="relative w-full h-full bg-black">
        {/* Restricted Video Overlay */}
        {videoRestricted && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 text-white">
            <p className="text-xl mb-4">This video is restricted or unavailable</p>
            <p className="text-sm">
              {hasNextVideo ? `Skipping to next video in ${countdown} seconds...` : "No more videos available"}
            </p>
          </div>
        )}

        {/* Countdown Overlay */}
        {videoEnded && countdown > 0 && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-3xl text-white">
            <div className="text-6xl font-bold mb-4">{countdown}</div>
            <p className="text-xl mb-2">Up Next</p>
            <p className="text-sm mb-6">Playing in {countdown} seconds...</p>
            <button
              onClick={() => {
                clearCountdownTimer();
                setCountdown(0);
                setVideoEnded(false);
                playNext();
              }}
              className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition"
            >
              Play Now
            </button>
          </div>
        )}

        {/* Replay Overlay (End of Content) */}
        {videoEnded && countdown === 0 && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-3xl text-white animate-in fade-in zoom-in duration-500">
            <h2 className="text-5xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Thanks for watching!</h2>
            <button
              onClick={handleReplay}
              className="px-8 py-3 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition transform hover:scale-110 shadow-lg hover:shadow-xl hover:shadow-white/20"
            >
              Replay Video
            </button>
          </div>
        )}

        {/* Player Container */}
        <div className="w-full h-full">
          <div ref={playerContainerRef} className="w-full h-full" />
        </div>

        {/* Navigation Controls */}
        {(isSeries || hasPlaylist) && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-black/70 px-6 py-3 rounded-full">
            <button
              onClick={playPrevious}
              disabled={!hasPreviousVideo}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <span className="text-white text-sm font-medium">
              {currentVideoIndex + 1} / {currentQueue.length}
            </span>

            <button
              onClick={playNext}
              disabled={!hasNextVideo}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    );
  }
);

function propsAreEqual(prev: VideoPlayerProps, next: VideoPlayerProps) {
  // Re-render if video ID changes
  if (prev.videoId !== next.videoId) return false;

  return (
    prev.movieId === next.movieId &&
    prev.episodeId === next.episodeId &&
    prev.playlistInfo?.current === next.playlistInfo?.current
  );
}

export default memo(VideoPlayer, propsAreEqual);