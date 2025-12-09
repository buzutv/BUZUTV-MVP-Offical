import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "../integrations/supabase/client";
import { getYouTubeEmbedUrl, fetchWatchHistory, onReadyVideoLoader } from "@/utils/youtubeUtils";

interface VideoPlayerProps {
  videoId: string;
  setActualVideoUrl?: (videoId: string) => void;
  playlistItems?: object[];
  movieId: string;
  userid: string;
  setFinal?: (any) => void;

  onWatchHistoryUpdate?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  playlistItems,
  movieId,
  setFinal,
  userid
}) => {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);
  const movieIdRef = useRef<string>(movieId);
  const [lastPosition, setLastPosition] = useState<number>(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);
  const [countdown, setCountdown] = useState(5);
  const [videoEnded, setVideoEnded] = useState(false);
  const [videoRestricted, setVideoRestricted] = useState(false);
  const countdownRef = useRef<any>(null);

  const getVideoId = (inputVideoId: string) => {
    if (!inputVideoId) return null;
    const embedUrl = getYouTubeEmbedUrl(inputVideoId);
    const videoIdMatch = embedUrl?.match(/embed\/([^?]+)/);
    return videoIdMatch ? videoIdMatch[1] : null;
  };


  // console.log("final state", final)

  useEffect(() => {
    async function fetchandSet() {
      const value = await fetchWatchHistory(userid, movieId);
      setFinal(value?.last_position)

    }
    fetchandSet()
  }, [])
  // Check if navigation buttons should be enabled
  const hasNextVideo = playlistItems?.contents && currentIndex < playlistItems.contents.length - 1;
  const hasPreviousVideo = playlistItems?.contents && currentIndex > 0;
  const hasPlaylist = playlistItems?.contents && playlistItems.contents.length > 1;

  async function saveWatchHistory(userid: string, movieId: string, videoId: string, currentTime: number, completed: boolean) {
    console.log("Movie Id", movieId);

    await supabase
      .from("user_watch_history")
      .upsert(
        {
          user_id: userid,
          movie_id: movieId,
          watched_at: new Date().toISOString(),
          last_position: completed ? 0 : Math.floor(currentTime),
          watch_percentage: completed ? 100 : Math.floor((currentTime / playerInstanceRef.current.getDuration()) * 100),
          completed: completed
        },
        { onConflict: "user_id,movie_id" }
      );
  }

  useEffect(() => {
    if (!videoId || !movieId) return;

    const loadPlayer = async () => {
      const vid = getVideoId(videoId);

      // Destroy existing player
      if (playerInstanceRef.current) {
        playerInstanceRef.current.destroy();
        playerInstanceRef.current = null;
      }

      // Load YouTube API if not loaded
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
            rel: 0,  // Hide related videos
            showinfo: 0,  // Hide video info
            modestbranding: 1  // Minimal YouTube branding
          },
          events: {
            onReady: (e: any) => onReadyVideoLoader(e, movieId, "03fa9a91-4281-4bd4-9e60-4da2ba72b0f3"),
            onStateChange: async (e: any) => {
              if (e.data === window.YT.PlayerState.ENDED) {
                await saveWatchHistory(userid, movieId, videoId, e.target.getCurrentTime(), true);
                console.log("Movie finished. Starting countdown to next video...");

                // Only start countdown if there's a next video
                if (playlistItems?.contents?.length > 0 && currentIndexRef.current < playlistItems.contents.length - 1) {
                  startCountdown();
                  playNext()
                }
              }

              if (e.data === window.YT.PlayerState.PAUSED) {
                await saveWatchHistory(userid, movieId, videoId, e.target.getCurrentTime(), false);
              }

              if (e.data === window.YT.PlayerState.BUFFERING) {
                const currentTime = e.target.getCurrentTime();
                if (currentTime > 1) {
                  setFinal(e.target.getCurrentTime());
                  await saveWatchHistory(userid, movieId, videoId, e.target.getCurrentTime(), false);
                }
              }
            },
            onError: (err: any) => {
              console.log("YT Error:", err.data);
              if (err.data === 150 || err.data === 101) {
                setVideoRestricted(true);
                // Only skip if there's a next video
                if (playlistItems?.contents?.length > 0 && currentIndexRef.current < playlistItems.contents.length - 1) {
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

    return () => {
      if (playerInstanceRef.current) {
        playerInstanceRef.current.destroy();
        playerInstanceRef.current = null;
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [videoId, movieId, userid]);

  const startCountdown = async () => {
    setVideoEnded(true);
    setCountdown(5);

    countdownRef.current = setInterval(async () => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          setVideoEnded(false);
          playNext();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const playNext = async () => {
    if (!playlistItems?.contents || currentIndexRef.current >= playlistItems.contents.length - 1) {
      console.log("No next video available");
      return;
    }

    currentIndexRef.current += 1;
    setCurrentIndex(currentIndexRef.current);

    const nextVideo = playlistItems.contents[currentIndexRef.current];
    const nextVideoId = getVideoId(nextVideo.video_url);

    movieIdRef.current = nextVideo.id;
    setVideoEnded(false);
    setVideoRestricted(false);

    // Clear countdown if manually navigating
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    const history = await fetchWatchHistory(userid, nextVideo.id);

    if (playerInstanceRef.current && nextVideoId) {
      playerInstanceRef.current.loadVideoById({
        videoId: nextVideoId,
        startSeconds: history?.last_position || 0,
      });
    }
  };

  const playPrevious = async () => {
    if (!playlistItems?.contents || currentIndexRef.current <= 0) {
      console.log("No previous video available");
      return;
    }

    currentIndexRef.current -= 1;
    setCurrentIndex(currentIndexRef.current);

    const prevVideo = playlistItems.contents[currentIndexRef.current];
    const prevVideoId = getVideoId(prevVideo.video_url);

    movieIdRef.current = prevVideo.id;
    setVideoEnded(false);
    setVideoRestricted(false);

    // Clear countdown if manually navigating
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    if (prevVideoId && playerInstanceRef.current) {
      const history = await fetchWatchHistory(userid, prevVideo.id);
      playerInstanceRef.current.loadVideoById({
        videoId: prevVideoId,
        startSeconds: history?.last_position || 0,
      });
    }
  };

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

      {/* Countdown Overlay After Video Ends */}
      {videoEnded && !videoRestricted && (
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
                clearInterval(countdownRef.current);
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

      {/* Youtube Player Container */}
      <div className="w-full h-full relative rounded-lg overflow-hidden bg-black">
        <div ref={playerContainerRef} id="yt-player" className="w-full h-full" />
      </div>

      {/* Enhanced Navigation Controls - Only show if playlist exists */}
      {hasPlaylist && (
        <>
          {/* Previous Button */}
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
            title={hasPreviousVideo ? "Previous video" : "No previous video"}
            aria-label="Previous video"
          >
            <ChevronLeft className={`w-10 h-10 ${hasPreviousVideo ? '' : 'opacity-50'}`} strokeWidth={2.5} />
          </button>

          {/* Next Button */}
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
            title={hasNextVideo ? "Next video" : "No next video"}
            aria-label="Next video"
          >
            <ChevronRight className={`w-10 h-10 ${hasNextVideo ? '' : 'opacity-50'}`} strokeWidth={2.5} />
          </button>

          {/* Playlist Position Indicator */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 
            bg-black/80 backdrop-blur-md text-white px-6 py-2.5 rounded-full text-base font-semibold shadow-xl border border-white/10">
            <span className="text-blue-400">{currentIndex + 1}</span>
            <span className="text-white/60 mx-2">/</span>
            <span className="text-white/90">{playlistItems.contents.length}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default VideoPlayer;