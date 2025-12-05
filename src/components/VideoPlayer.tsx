import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../integrations/supabase/client";
import { getYouTubeEmbedUrl, fetchWatchHistory, onReadyVideoLoader } from "@/utils/youtubeUtils";

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

  async function saveWatchHistory(userid: string, movieId: string, videoId: string, currentTime: number, completed: boolean) {
    await supabase
      .from("user_watch_history")
      .upsert(
        {
          user_id: userid,
          movie_id: movieId,
          watched_at: new Date().toISOString(),
          last_position: Math.floor(currentTime),
          completed: completed
        },
        { onConflict: "user_id,movie_id" }
      );
  }

  // useEffect(() => {
  //   async function setLast() {
  //     const data = await fetchWatchHistory(userid, movieId)
  //     return data
  //   }
  //   const dataOne = setLast()

  //   console.log("dataOne", dataOne)
  // }, [userid, movieId])
  useEffect(() => {
    if (!videoId || !movieId) return;

    const loadPlayer = async () => {
      const vid = getVideoId(videoId);
      // const last = await fetchWatchHistory(userid, movieId)
      // console.log("stop", last)
      // setLastPosition(last)
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
            onReady: (e: any) => onReadyVideoLoader(e, movieId, "03fa9a91-4281-4bd4-9e60-4da2ba72b0f3"),
            onStateChange: async (e: any) => {
              if (e.data === window.YT.PlayerState.PAUSED || e.data === window.YT.PlayerState.ENDED) {
                await saveWatchHistory(userid, movieId, videoId, e.target.getCurrentTime(), true);
              }
              if (e.data === window.YT.PlayerState.PAUSED) {
                await saveWatchHistory(userid, movieId, videoId, e.target.getCurrentTime(), false);
              }
              // if (e.data === window.YT.PlayerState.BUFFERING) {
              //   const currentTime = e.target.getCurrentTime();
              //   if (currentTime > 1) {
              //     await saveWatchHistory(userid, movieId, videoId, e.target.getCurrentTime(), false);
              //   }
              // }
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
