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
} from "lucide-react";
import { getYouTubeEmbedUrl } from "@/utils/youtubeUtils";
// import { supabase } from "@/lib/supabaseClient";
import {supabase} from "../integrations/supabase/client";
import { getLastPausedTime } from "@/utils/youtubeUtils";
interface FullscreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
  userId: string;
}

const FullscreenPlayer = ({
  isOpen,
  onClose,
  videoUrl,
  title,
  userId,
}: FullscreenPlayerProps) => {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [movies, setMovies] = useState<any[]>([]);
  const [lastPausedTime, setLastPausedTime] = useState<number | null>(null);


  useEffect(() =>{
    async function fetchMovies() {
      const { data, error } = await supabase
        .from('content')
        .select('*')          // make sure to select columns
        .eq('video_url', videoUrl);

      if (error) {
        console.error('Error fetching movies:', error);
      } else {
        console.log('Fetched movies:', data);
        setMovies(data || []);
      }
    }

    if (videoUrl) {
      fetchMovies();
    }
  },[videoUrl])


  
  useEffect(() => {
  if (!isOpen || !videoUrl) return;

  async function fetchLastPausedTime() {
    if (movies.length === 0) return;
    const lastPaused = await getLastPausedTime(movies[0]?.id, userId);
    setLastPausedTime(lastPaused);
  }

  fetchLastPausedTime();
}, [movies]);



  console.log("Last paused time in FullscreenPlayer:", lastPausedTime);


  useEffect(() => {
  const player = playerInstanceRef.current;
    if (!player) return;
    if (lastPausedTime === null) return;

    player.seekTo(lastPausedTime, true);
}, [lastPausedTime]);





  console.log("Movies in FullscreenPlayer:", movies);
 

  // 🔒 Escape + scroll lock
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) onClose();
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
  }, [isOpen, onClose]);

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
              // Get last paused time from DB (if any) and seek to it
             
              if (lastPausedTime) {
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
              }
              if (e.data === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false);
                // savePauseTime(videoId, userId, player.getCurrentTime());
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
  }, [isOpen, videoUrl, userId,lastPausedTime]);

  // 🎮 Controls
 const handlePlayPause = async () => {
  const player = playerInstanceRef.current;
  if (!player) return;

  console.log("Who the heck are you", player)
  if (!player || !("getCurrentTime" in player)) {
  console.warn("Player not ready yet");
  return;
}
  if (isPlaying) {
    // --- USER IS PAUSING VIDEO ---
    player.pauseVideo();

    const pausedAt = player.getCurrentTime(); // synchronous
    console.log("Paused at:", pausedAt);

    try {
      const { data, error } = await supabase
        .from("user_watch_history")
        .upsert({
          user_id: userId,
          movie_id: movies[0]?.id,
          watched_at: new Date(),
          last_position: Math.floor(pausedAt),
          watch_duration: Math.floor(duration),
          watch_percentage: Math.floor((pausedAt / duration) * 100),
          total_duration: Math.floor(duration),
          completed: pausedAt >= duration,
        }, { onConflict: ['user_id', 'movie_id'] }); // specify conflict columns


      if (error) console.error("Supabase insert error:", error);
      else console.log("Inserted watch history:", data);
    } catch (err) {
      console.error("Error saving watch history:", err);
    }

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

  // 💾 Save pause time
  // const savePauseTime = async (videoId: string, userId: string, pausedAt: number) => {
  //   const { error } = await supabase
  //     .from("video_pauses")
  //     .insert([{ video_id: videoId, user_id: userId, paused_at: pausedAt }]);
  //   if (error) console.error("Error saving pause time:", error);
  // };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black"
      style={{ zIndex: 999999, transform: "translateZ(0)", isolation: "isolate" }}
    >
      <div className="relative w-full h-full">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-[1000000] bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Player */}
        <div ref={playerContainerRef} className="w-full h-full" />

        {/* Controls */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-4 z-[1000000]">
          <button onClick={() => handleSeek(-10)} className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-full">
            <RotateCcw className="w-6 h-6" />
          </button>
          <button onClick={handlePlayPause} className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-full">
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>
          <button onClick={() => handleSeek(10)} className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-full">
            <RotateCw className="w-6 h-6" />
          </button>
          <button onClick={handleMute} className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-full">
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
            className="flex-1 h-1 rounded-lg accent-white"
          />
          <span className="text-white text-sm">{formatTime(duration)}</span>
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
