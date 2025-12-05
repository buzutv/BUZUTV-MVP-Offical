import React, { useEffect, useRef,useState } from "react";
import { supabase } from "../integrations/supabase/client";
import { getYouTubeEmbedUrl,fetchWatchHistory } from "@/utils/youtubeUtils";

interface VideoPlayerProps {
  videoId: string;
//   last_position: number;
  movieId: string;
  userid: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
//   last_position,
  movieId,
  userid
}) => {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);
   const [lastPosition, setLastPosition] = useState<number>(0)
  const getVideoId = (inputVideoId: string) => {
    if (!inputVideoId) return null;
    const embedUrl = getYouTubeEmbedUrl(inputVideoId);
    const videoIdMatch = embedUrl?.match(/embed\/([^?]+)/);
    return videoIdMatch ? videoIdMatch[1] : null;
  };

  async function saveWatchHistory(userid: string, movieId: string, videoId: string, currentTime: number) {
    await supabase
      .from("user_watch_history")
      .upsert(
        {
          user_id: userid,
          movie_id: movieId,
          watched_at: new Date().toISOString(),
          last_position: Math.floor(currentTime),
        },
        { onConflict: "user_id,movie_id" }
      );
  }

  useEffect(() =>{
    async function setLast() {
       const data =  await fetchWatchHistory(userid, movieId)
       return data
    }
    const dataOne = setLast()

    console.log("dataOne", dataOne)
  },[userid, movieId])
  useEffect(() => {
    if (!videoId || !movieId) return;

    const loadPlayer = async () => {
      const vid = getVideoId(videoId);
      const last =  await fetchWatchHistory(userid, movieId)
      console.log("stop", last)
      setLastPosition(last)
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
          playerVars: { autoplay: 1, controls: 1 },
          events: {
            onReady: async (e: any) => {
              e.target.seekTo( lastPosition, true); // true = allowSeekAhead
              e.target.playVideo();
            },
            onStateChange: async (e: any) => {
              if (e.data === window.YT.PlayerState.PAUSED || e.data === window.YT.PlayerState.ENDED) {
                await saveWatchHistory(userid, movieId, videoId, e.target.getCurrentTime());
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
    };
  }, [videoId, movieId, userid]);




  return <div ref={playerContainerRef} className="w-full h-full" />;
};

export default VideoPlayer;
