import React, { useEffect, useImperativeHandle, forwardRef, useRef, useState, memo, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getYouTubeEmbedUrl, onReadyVideoLoader, fetchWatchHistory, saveWatchHistory } from "@/utils/youtubeUtils";

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
}

const VideoPlayer: React.FC<VideoPlayerProps> = forwardRef(({
  videoId,

  playlistItems,
  setCurrentMovie,
  movieId,
  episodeId,
  setFinal,
  type,
  userid,
  playlistInfo
  
}, ref) => {


  
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);
  const movieIdRef = useRef<string>(movieId);
  const episodeIdRef = useRef<string>(episodeId);
  const playlistRef = useRef(playlistItems);
  const currentIndexRef = useRef(0);
  const countdownRef = useRef<any>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [videoEnded, setVideoEnded] = useState(false);
  const [videoRestricted, setVideoRestricted] = useState(false);

  // Sync refs
  useEffect(() => { playlistRef.current = playlistItems; }, [playlistItems,videoId]);
  useEffect(() => { currentIndexRef.current = playlistInfo?.current || 0; }, [playlistInfo,videoId]);
  useEffect(() => {  movieIdRef.current = movieId }, [movieId]);
  useEffect(() => {  episodeIdRef.current = episodeId }, [episodeId]);
  console.log("Video Player Rendered with Video ID:", movieId, movieIdRef.current, episodeIdRef.current);
  useImperativeHandle(ref, () => ({
    play: () => playerInstanceRef.current?.playVideo(),
    pause: () => playerInstanceRef.current?.pauseVideo(),
    getDuration: () => playerInstanceRef.current?.getDuration(),
  }));

  // --- FIXED ID EXTRACTION ---
  const getVideoId = useCallback((inputVideoId: string) => {
    if (!inputVideoId) return null;
    try {
        // If it's already just an ID (no slashes), return it
        if (!inputVideoId.includes("/")) return inputVideoId;

        const embedUrl = getYouTubeEmbedUrl(inputVideoId);
        const videoIdMatch = embedUrl?.match(/embed\/([^?]+)/);
        return videoIdMatch ? videoIdMatch[1] : null;
    } catch (e) {
        return null;
    }
  }, []);

  // --- 1. INITIALIZE PLAYER ---
  useEffect(() => {
    // GUARD: If no videoId is passed yet, do not attempt to load anything
    if (!videoId) return;

    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }

    const initPlayer = () => {
      if (playerInstanceRef.current) return;
      
      const vid = getVideoId(videoId);
      console.log("Initializing YouTube Player with ID:", vid);
      // GUARD: If extraction failed or ID is invalid, STOP here to prevent crash
      if (!vid) {
          console.warn("VideoPlayer: Attempted to init with invalid ID", videoId);
          return;
      }

      playerInstanceRef.current = new window.YT.Player(playerContainerRef.current, {
        height: "100%",
        width: "100%",
        videoId: vid,
        playerVars: {
          autoplay: 1,
          controls: 1,
          rel: 0,
          showinfo: 0,
          modestbranding: 1
        },
        events: {
         
          onReady: (e: any) => onReadyVideoLoader(e, movieIdRef.current, userid),
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

    // Cleanup on unmount
    return () => {
       // We do NOT destroy the player here on props change, only on component unmount
       // But if the component is actually unmounting, we clean up.
    };
  }, []); // Intentionally empty dependency to run only on mount

  // --- 2. HANDLE VIDEO CHANGES (Smooth Transition) ---
  useEffect(() => {
    // If videoId changes, we update the existing player instead of re-creating it
    const vid = getVideoId(videoId);

    if (playerInstanceRef.current && vid) {
       try {
           // Only load if it's actually different to prevent restarting
           const currentUrl = playerInstanceRef.current.getVideoUrl();
           // YouTube URL check isn't always perfect, so we just load if we have a valid ID
           playerInstanceRef.current.loadVideoById(vid);
       } catch (e) {
           console.error("Error loading new video into existing player", e);
       }
    } else if (!playerInstanceRef.current && vid && window.YT && window.YT.Player) {
        // Fallback: If player wasn't ready on mount (due to missing ID), try init again
        // This handles the case where videoId was null initially but populated later
        const initLazy = () => {
            playerInstanceRef.current = new window.YT.Player(playerContainerRef.current, {
                height: "100%",
                width: "100%",
                videoId: vid,
                playerVars: { autoplay: 1, controls: 1, rel: 0, showinfo: 0, modestbranding: 1 },
                events: {
                  onReady: (e: any) => onReadyVideoLoader(e, movieIdRef.current, userid),
                  onStateChange: handlePlayerStateChange,
                  onError: handlePlayerError,
                },
            });
        }
        initLazy();
    }
  }, [videoId]);


  // --- HELPER FUNCTIONS ---

  const handlePlayerStateChange = async (e: any) => {
    
      if (e.data === window.YT.PlayerState.ENDED) {
        await saveWatchHistory(userid, movieIdRef.current, episodeIdRef.current, videoId, e.target.getCurrentTime(), true, playerInstanceRef,type);
        
        const currentList = playlistRef.current?.contents;
        if (currentList && currentList.length > 0 && currentIndexRef.current < currentList.length - 1) {
          startCountdown();
        }
      }

      if (e.data === window.YT.PlayerState.PAUSED) {
        await saveWatchHistory(userid, movieId,episodeId, videoId, e.target.getCurrentTime(), false, playerInstanceRef,type);
      }

      if (e.data === window.YT.PlayerState.BUFFERING) {
        const currentTime = e.target.getCurrentTime();
        if (currentTime > 1 && setFinal) {
          setFinal(currentTime);
          await saveWatchHistory(userid, movieId, episodeId, videoId, currentTime, false,type, playerInstanceRef,type);
        }
      }
  };

  const handlePlayerError = (err: any) => {
      console.log("YT Error:", err.data);
      if (err.data === 150 || err.data === 101) {
        setVideoRestricted(true);
        const currentList = playlistRef.current?.contents;
        if (currentList && currentList.length > 0 && currentIndexRef.current < currentList.length - 1) {
          startCountdown();
        }
      }
  };

  const clearCountdownTimer = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  const startCountdown = () => {
    clearCountdownTimer();
    setVideoEnded(true);
    setCountdown(5);

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearCountdownTimer();
          setVideoEnded(false);
          playNext();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const playNext = async () => {
    const currentList = playlistRef.current?.contents;
    if (!currentList || currentIndexRef.current >= currentList.length - 1) return;

    clearCountdownTimer();
    setVideoEnded(false);
    setVideoRestricted(false);
    
    currentIndexRef.current += 1;
    setCurrentIndex(currentIndexRef.current);
    
    const nextVideo = currentList[currentIndexRef.current];
    if(setCurrentMovie) setCurrentMovie(nextVideo);
  };

  const playPrevious = async () => {
    const currentList = playlistRef.current?.contents;
    if (!currentList || currentIndexRef.current <= 0) return;

    clearCountdownTimer();
    setVideoEnded(false);
    setVideoRestricted(false);

    currentIndexRef.current -= 1;
    setCurrentIndex(currentIndexRef.current);

    const prevVideo = currentList[currentIndexRef.current];
    if(setCurrentMovie) setCurrentMovie(prevVideo);
  };

  const hasNextVideo = playlistItems?.contents && currentIndex < playlistItems.contents.length - 1;
  const hasPreviousVideo = playlistItems?.contents && currentIndex > 0;
  const hasPlaylist = playlistItems?.contents && playlistItems.contents.length > 1;

  // Cleanup on true unmount
  useEffect(() => {
      return () => {
          if (playerInstanceRef.current) {
              try { playerInstanceRef.current.destroy(); } catch(e){}
              playerInstanceRef.current = null;
          }
          clearCountdownTimer();
      }
  }, [])

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
        <div ref={playerContainerRef} className="w-full h-full" />
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
            <span className="text-blue-400">{currentIndex + 1}</span> 
            <span className="text-white/60 mx-2">/</span>
            <span className="text-white/90">{playlistItems?.contents?.length || playlistInfo?.totalMovies}</span>
          </div>
        </>
       )}
    </div>
  );
});

function propsAreEqual(prev: VideoPlayerProps, next: VideoPlayerProps) {
  return (
    prev.videoId === next.videoId && 
    prev.movieId === next.movieId &&
    prev.playlistInfo?.current === next.playlistInfo?.current
  );
}

export default memo(VideoPlayer, propsAreEqual);