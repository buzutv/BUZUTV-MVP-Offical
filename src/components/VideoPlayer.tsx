import React, { useEffect, useImperativeHandle, forwardRef, useRef, useState, memo, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getYouTubeEmbedUrl, onReadyVideoLoader, saveWatchHistory } from "@/utils/youtubeUtils";
import { useSelector } from "react-redux";

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
  
  // Refs for props to avoid stale closures in event listeners
  const movieIdRef = useRef<string>(movieId);
  const episodeIdRef = useRef<string>(episodeId);
  const playlistRef = useRef(playlistItems);
  const currentIndexRef = useRef(0);
  const countdownRef = useRef<any>(null);

  // Redux State & Ref
  const selectedVideo = useSelector((state: any) => state.screenPlayer.selectedVideo);
  const selectedVideoRef = useRef(selectedVideo);
  const playlistFullObject = useSelector((state: any) => state?.screenPlayer?.playlistInfo) || {};
  const currentVideoIndex = useSelector((state: any) => state?.screenPlayer?.currentVideoIndex) || 0;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [videoEnded, setVideoEnded] = useState(false);
  const [videoRestricted, setVideoRestricted] = useState(false);

  // --- SYNC REFS ---
  useEffect(() => { playlistRef.current = playlistItems; }, [playlistItems, videoId]);
  useEffect(() => { currentIndexRef.current = playlistInfo?.current || 0; }, [playlistInfo, videoId]);
  useEffect(() => { movieIdRef.current = movieId }, [movieId]);
  useEffect(() => { episodeIdRef.current = episodeId }, [episodeId]);

  // Update the selectedVideoRef whenever Redux changes so the player always has the latest data
  useEffect(() => { selectedVideoRef.current = selectedVideo; }, [selectedVideo]);

  console.log("Video Player Rendered with Video ID:", movieId, videoId,episodeIdRef.current);

  useImperativeHandle(ref, () => ({
    play: () => playerInstanceRef.current?.playVideo(),
    pause: () => playerInstanceRef.current?.pauseVideo(),
    getDuration: () => playerInstanceRef.current?.getDuration(),
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
  const resumeVideoPosition = (player: any) => {
    const currentVidData = selectedVideoRef.current;
    
    if (currentVidData) {
      const history = Array.isArray(currentVidData.user_watch_history) 
        ? currentVidData.user_watch_history[0] 
        : currentVidData.user_watch_history;
        
      // Flatten logic: check direct props or nested history props
      const isCompleted = currentVidData.completed || history?.completed;
      const watchPct = currentVidData.watch_percentage || history?.watch_percentage || 0;
      const lastPos = currentVidData.last_position || history?.last_position || 0;

      console.log("Resuming logic:", { isCompleted, watchPct, lastPos });

      if (isCompleted || watchPct >= 99) {
        player.seekTo(0, true);
      } else if (lastPos > 0) {
        player.seekTo(lastPos, true);
      }
      player.playVideo();
    }
  };

  // --- INITIALIZE & UPDATE PLAYER ---
  useEffect(() => {
    if (!videoId) return;

    const vid = getVideoId(videoId);
    if (!vid) {
        console.warn("VideoPlayer: Attempted to init with invalid ID", videoId);
        return;
    }

    // 1. If player exists, just load the new video
    if (playerInstanceRef.current) {
      try {
        console.log("Switching video to:", vid);
        playerInstanceRef.current.loadVideoById(vid);
        
        // IMPORTANT: onReady does NOT fire on loadVideoById. 
        // We wait a moment for metadata to load, then seek.
        setTimeout(() => {
            resumeVideoPosition(playerInstanceRef.current);
        }, 500); 

      } catch (e) {
        console.error("Error loading new video into existing player", e);
      }
      return; 
    }

    // 2. If player does not exist, create it
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }

    const initPlayer = () => {
      if (playerInstanceRef.current) return;
      
      console.log("Initializing NEW YouTube Player with ID:", vid);
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
          onReady: (e: any) => {
            // Trigger external loader if needed
            onReadyVideoLoader(e, selectedVideoRef.current, userid);
            // Trigger local resume logic
            resumeVideoPosition(e.target);
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

  }, [videoId]); // Re-run this effect when videoId changes

  // --- EVENT HANDLERS ---

  const handlePlayerStateChange = async (e: any) => {
    if (e.data === window.YT.PlayerState.ENDED) {
      await saveWatchHistory(userid, movieIdRef.current, episodeIdRef.current, videoId, e.target.getCurrentTime(), true, playerInstanceRef, type);
      
      const currentList = playlistRef.current?.contents;
      if (currentList && currentList.length > 0 && currentIndexRef.current < currentList.length - 1) {
        startCountdown();
      }
    }

    if (e.data === window.YT.PlayerState.PAUSED) {
      await saveWatchHistory(userid, movieIdRef.current, episodeIdRef.current, videoId, e.target.getCurrentTime(), false, playerInstanceRef, type);
    }

    if (e.data === window.YT.PlayerState.BUFFERING) {
      const currentTime = e.target.getCurrentTime();
      if (currentTime > 1 && setFinal) {
        setFinal(currentTime);
        // Note: Check arguments for saveWatchHistory, passed 'type' twice in your original code, cleaned up here
        await saveWatchHistory(userid, movieIdRef.current, episodeIdRef.current, videoId, currentTime, false, playerInstanceRef, type);
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
  const playlist_items = playlistFullObject[0]?.playlist_items;

  const hasNextVideo = playlist_items && currentIndex < playlist_items.length - 1;
  const hasPreviousVideo = playlist_items && currentIndex > 0;
  const hasPlaylist = playlist_items && playlist_items.length > 1;

  // Cleanup on unmount
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
            <span className="text-blue-400">{currentVideoIndex + 1}</span> 
            <span className="text-white/60 mx-2">/</span>
            <span className="text-white/90">{playlistItems?.contents?.length || playlistFullObject[0]?.playlist_items?.length}</span>
          </div>
        </>
       )}
    </div>
  );
});

function propsAreEqual(prev: VideoPlayerProps, next: VideoPlayerProps) {
  // If the VIDEO ID is different, we MUST re-render
  if (prev.videoId !== next.videoId) return false;

  return (
    prev.movieId === next.movieId &&
    prev.playlistInfo?.current === next.playlistInfo?.current
  );
}

export default memo(VideoPlayer, propsAreEqual);