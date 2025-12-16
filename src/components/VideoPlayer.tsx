import React, { useEffect, useImperativeHandle, forwardRef, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getYouTubeEmbedUrl, onReadyVideoLoader, fetchWatchHistory, saveWatchHistory } from "@/utils/youtubeUtils";

interface VideoPlayerProps {
  videoId: string;
  setActualVideoUrl?: (videoId: string) => void;
  setCurrentMovie?: (movie: any) => void;
  playlistItems?: any; // relaxed type for flexibility
  movieId: string;
  type: string;
  playlistInfo?: any;
  userid: string;
  setFinal?: (any: any) => void;
  onWatchHistoryUpdate?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = forwardRef(({
  videoId,
  playlistItems,
  setCurrentMovie,
  movieId,
  setFinal,
  type,
  userid,
  playlistInfo

}, ref) => {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);
  const movieIdRef = useRef<string>(movieId);
  // REFS: Use refs for data accessed inside Event Listeners to avoid stale closures
  const playlistRef = useRef(playlistItems);
  const currentIndexRef = useRef(0);
  const countdownRef = useRef<any>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [videoEnded, setVideoEnded] = useState(false);
  const [videoRestricted, setVideoRestricted] = useState(false);

  console.log("Playlist info", playlistItems)
  // Sync refs with props whenever they change
  useEffect(() => {
    playlistRef.current = playlistItems;
  }, [playlistItems]);

  useEffect(() =>{
    currentIndexRef.current = playlistInfo.current
  },[playlistInfo.index])

  useEffect(() => {
    movieIdRef.current = movieId;
  }, [movieId]);

  useImperativeHandle(ref, () => ({
    play: () => playerInstanceRef.current?.playVideo(),
    pause: () => playerInstanceRef.current?.pauseVideo(),
    getDuration: () => playerInstanceRef.current?.getDuration(),
  }));

  const getVideoId = (inputVideoId: string) => {
    if (!inputVideoId) return null;
    const embedUrl = getYouTubeEmbedUrl(inputVideoId);
    const videoIdMatch = embedUrl?.match(/embed\/([^?]+)/);
    return videoIdMatch ? videoIdMatch[1] : null;
  };

  // --- ROBUST COUNTDOWN LOGIC ---
  const clearCountdownTimer = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  const startCountdown = () => {
    // 1. Always clear existing timer first to prevent duplicates
    clearCountdownTimer();

    setVideoEnded(true);
    setCountdown(5);

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        // If we hit 1 (about to go to 0), trigger next
        if (prev <= 1) {
          clearCountdownTimer();
          setVideoEnded(false);
          playNext(); // Trigger navigation
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const playNext = async () => {
    // Access the LATEST playlist data via ref
    const currentList = playlistRef.current?.contents;

    if (!currentList || currentIndexRef.current >= currentList.length - 1) {
      console.log("No next video available");
      return;
    }

    // Stop any running countdowns immediately
    clearCountdownTimer();
    setVideoEnded(false);
    setVideoRestricted(false);
    
    // Update index
    currentIndexRef.current += 1;
    setCurrentIndex(currentIndexRef.current);
    // if(playlistInfo.index < currentList.length -1) playlistInfo.setIndex(index  => index + 1);
    const nextVideo = currentList[currentIndexRef.current];
    const nextVideoId = getVideoId(nextVideo.video_url);
    setCurrentMovie(nextVideo)
    // Update Movie ID ref for history tracking
    movieIdRef.current = nextVideo.id;

    // Load history for next video
    const history = await fetchWatchHistory(userid, nextVideo.id);

    // Load the video into the existing player
    if (playerInstanceRef.current && nextVideoId) {
      playerInstanceRef.current.loadVideoById({
        videoId: nextVideoId,
        startSeconds: history?.last_position || 0,
      });
    }
  };

  const playPrevious = async () => {
    const currentList = playlistRef.current?.contents;
    console.log("Current List", currentList)
    if (!currentList || currentIndexRef.current <= 0) {
      console.log("No previous video available");
      return;
    }

    clearCountdownTimer();
    setVideoEnded(false);
    setVideoRestricted(false);

    currentIndexRef.current -= 1;
    setCurrentIndex(currentIndexRef.current);
    if(playlistInfo.index > 0) playlistInfo.setIndex(index  => index - 1);

    const prevVideo = currentList[currentIndexRef.current];
    const prevVideoId = getVideoId(prevVideo.video_url);
    setCurrentMovie(prevVideo)
    movieIdRef.current = prevVideo.id;

    if (prevVideoId && playerInstanceRef.current) {
      const history = await fetchWatchHistory(userid, prevVideo.id);
      playerInstanceRef.current.loadVideoById({
        videoId: prevVideoId,
        startSeconds: history?.last_position || 0,
      });
    }
  };

  // Initial Fetch Effect
  useEffect(() => {
    async function fetchandSet() {
      const value = await fetchWatchHistory(userid, movieId);
      if (setFinal) setFinal(value?.last_position);
    }
    fetchandSet();
  }, []);

  // Player Load Effect
  useEffect(() => {
    if (!videoId || !movieId) return;

    const loadPlayer = async () => {
      const vid = getVideoId(videoId);

      if (playerInstanceRef.current) {
        playerInstanceRef.current.destroy();
        playerInstanceRef.current = null;
      }

      if (!window.YT) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
      }

      const init = () => {
        playerInstanceRef.current = new window.YT.Player(playerContainerRef.current, {
          height: "390",
          width: "640",
          videoId: vid,
          playerVars: {
            autoplay: 1,
            controls: 1,
            rel: 0,
            showinfo: 0,
            modestbranding: 1
          },
          events: {
            onReady: (e: any) => onReadyVideoLoader(e, movieId, "03fa9a91-4281-4bd4-9e60-4da2ba72b0f3"),
            onStateChange: async (e: any) => {
              const currentList = playlistRef.current?.contents;

              if (e.data === window.YT.PlayerState.ENDED) {
                // Save history
                await saveWatchHistory(userid, movieIdRef.current, videoId, e.target.getCurrentTime(), true, playerInstanceRef);

                console.log("Movie finished. Checking for next video...");

                // CHECK: Use REF data for checking next video availability
                if (currentList && currentList.length > 0 && currentIndexRef.current < currentList.length - 1) {
                  console.log("Next video found. Starting countdown.");
                  startCountdown();
                } else {
                  console.log("Playlist finished.");
                }
              }

              if (e.data === window.YT.PlayerState.PAUSED) {
                await saveWatchHistory(userid, movieIdRef.current, videoId, e.target.getCurrentTime(), false, playerInstanceRef);
              }

              if (e.data === window.YT.PlayerState.BUFFERING) {
                const currentTime = e.target.getCurrentTime();
                if (currentTime > 1 && setFinal) {
                  setFinal(currentTime);
                  await saveWatchHistory(userid, movieIdRef.current, videoId, currentTime, false, playerInstanceRef);
                }
              }
            },
            onError: (err: any) => {
              console.log("YT Error:", err.data);
              if (err.data === 150 || err.data === 101) {
                setVideoRestricted(true);
                // Check Ref for playlist length before skipping
                const currentList = playlistRef.current?.contents;
                if (currentList && currentList.length > 0 && currentIndexRef.current < currentList.length - 1) {
                  startCountdown();
                }
              }
            },
          },
        });
      };

      if (window.YT && window.YT.Player) {
        init();
      } else {
        (window as any).onYouTubeIframeAPIReady = init;
      }
    };

    loadPlayer();

    // CLEANUP
    return () => {
      if (playerInstanceRef.current) {
        playerInstanceRef.current.destroy();
        playerInstanceRef.current = null;
      }
      clearCountdownTimer(); // Clear timer on unmount
    };
  }, [videoId, movieId, userid]); // Note: playlistItems is intentionally NOT here to avoid reloading player on list update

  // Helper vars for UI
  const hasNextVideo = playlistItems?.contents && currentIndex < playlistItems.contents.length - 1;
  const hasPreviousVideo = playlistItems?.contents && currentIndex > 0;
  const hasPlaylist = playlistItems?.contents && playlistItems.contents.length > 1;

  return (
    <div className="relative w-full h-full">
      {/* Restricted Video Overlay */}
      {videoRestricted && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-40 rounded-lg">
          <div className="text-center p-8">
            <div className="text-white text-2xl font-semibold mb-4">
              This video is restricted or unavailable
            </div>
            <div className="text-white/70 text-lg">
              {hasNextVideo ? `Skipping to next video in ${countdown} seconds...` : "No more videos available"}
            </div>
          </div>
        </div>
      )}

      {/* Countdown Overlay */}
      {videoEnded && countdown > 0 && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-40 rounded-lg">
          <div className="text-center flex flex-col items-center bg-black/50 p-12 rounded-2xl">
            <div className="text-white text-8xl font-bold mb-6 animate-pulse">
              {countdown}
            </div>
            <div className="text-white text-3xl mb-4 font-semibold">
              Up Next
            </div>
            <div className="text-white/80 text-lg mb-8">
              Playing in {countdown} seconds...
            </div>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-xl transition-all duration-200 font-semibold shadow-2xl hover:shadow-blue-500/50 hover:scale-105 text-lg"
              onClick={() => {
                clearCountdownTimer();
                setCountdown(0);
                setVideoEnded(false);
                playNext();
              }}
            >
              Play Now
            </button>
          </div>
        </div>
      )}

      {/* Player Container */}
      <div className="w-full h-full relative rounded-lg overflow-hidden bg-black">
        <div ref={playerContainerRef} id="yt-player" className="w-full h-full" />
      </div>

      {/* Controls */}
      {(type === "series" || hasPlaylist) && (
        <>
          <button
            onClick={playPrevious}
            disabled={!hasPreviousVideo}
            className={`absolute top-1/2 left-6 -translate-y-1/2 z-30 
              flex items-center justify-center w-16 h-16 rounded-full 
              transition-all duration-300 shadow-2xl
              ${hasPreviousVideo
                ? 'bg-white/95 hover:bg-white hover:scale-125 text-gray-900 cursor-pointer active:scale-110'
                : 'bg-gray-600/30 text-gray-500 cursor-not-allowed opacity-40'
              }`}
          >
            <ChevronLeft className={`w-10 h-10 ${hasPreviousVideo ? '' : 'opacity-50'}`} strokeWidth={2.5} />
          </button>

          <button
            onClick={playNext}
            disabled={!hasNextVideo}
            className={`absolute top-1/2 right-6 -translate-y-1/2 z-30 
              flex items-center justify-center w-16 h-16 rounded-full 
              transition-all duration-300 shadow-2xl
              ${hasNextVideo
                ? 'bg-white/95 hover:bg-white hover:scale-125 text-gray-900 cursor-pointer active:scale-110'
                : 'bg-gray-600/30 text-gray-500 cursor-not-allowed opacity-40'
              }`}
          >
            <ChevronRight className={`w-10 h-10 ${hasNextVideo ? '' : 'opacity-50'}`} strokeWidth={2.5} />
          </button>

          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 
            bg-black/80 backdrop-blur-md text-white px-6 py-2.5 rounded-full text-base font-semibold shadow-xl border border-white/10">
            <span className="text-blue-400">{currentIndexRef?.current}</span>
            <span className="text-white/60 mx-2">/</span>
            <span className="text-white/90">{playlistInfo?.totalMovies}</span>
          </div>
        </>
      )}
    </div>
  );
});

export default VideoPlayer;