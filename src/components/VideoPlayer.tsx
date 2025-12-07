import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../integrations/supabase/client";
import { getYouTubeEmbedUrl, fetchWatchHistory, onReadyVideoLoader } from "@/utils/youtubeUtils";
import { eventNames } from "process";

interface VideoPlayerProps {
  videoId: string;
  //   last_position: number;
  setActualVideoUrl?: (videoId: string) => void;
  playlistItems?: object[];
  movieId: string;
  userid: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  //   last_position,
  playlistItems,
  movieId,
  userid
}) => {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);
  const movieIdRef = useRef<string>(movieId);
  const [lastPosition, setLastPosition] = useState<number>(0)
  const currentIndexRef = useRef(0)
  const getVideoId = (inputVideoId: string) => {
    if (!inputVideoId) return null;
    const embedUrl = getYouTubeEmbedUrl(inputVideoId);
    const videoIdMatch = embedUrl?.match(/embed\/([^?]+)/);
    return videoIdMatch ? videoIdMatch[1] : null;
  };

  async function saveWatchHistory(userid: string, movieId: string, videoId: string, currentTime: number, completed: boolean) {
    console.log("Movie Id", movieId)

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
              if (e.data === window.YT.PlayerState.BUFFERING) {
                const currentTime = e.target.getCurrentTime();
                if (currentTime > 1) {
                  await saveWatchHistory(userid, movieId, videoId, e.target.getCurrentTime(), false);
                }
              }
              if (e.data === window.YT.PlayerState.ENDED) {
                await saveWatchHistory(userid, movieId, videoId, e.target.getCurrentTime(), true);
                console.log("Movie is ended Play next movie if playlist or series", playlistItems)
                // Auto-play next video

                if (playlistItems && playlistItems?.contents?.length > 0) {
                  // Find current video index
                  const currentIndex = playlistItems?.contents.findIndex((item: any) => item.id === movieIdRef.current);

                  // Check if there's a next video
                  if (currentIndex !== -1 && currentIndex < playlistItems.contents.length - 1) {
                    const nextVideo = playlistItems.contents[currentIndex + 1];
                    const nextVideoId = getVideoId(nextVideo.video_url);

                    if (nextVideoId && playerInstanceRef.current) {
                      // Update refs
                      movieIdRef.current = nextVideo.id;
                      currentIndexRef.current = currentIndex + 1;

                      // Fetch watch history for next video
                      const history = await fetchWatchHistory(userid, nextVideo.id);

                      // Load next video
                      playerInstanceRef.current.loadVideoById({
                        videoId: nextVideoId,
                        startSeconds: history?.last_position || 0,
                      });
                    }
                  }
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
    };
  }, [videoId, movieId, userid]);

  const playNext = async () => {
    if (!playlistItems || currentIndexRef.current >= playlistItems.contents.length - 1) return;

    currentIndexRef.current += 1;
    const nextVideo = playlistItems.contents[currentIndexRef.current];
    const videoId = getVideoId(nextVideo.video_url);

    if (videoId && playerInstanceRef.current) {
      // Fetch last paused time for this user & video
      const lastPosition = await fetchWatchHistory(userid, nextVideo.id)
      console.log("Last Postion", lastPosition.last_position)
      playerInstanceRef.current.loadVideoById({
        videoId,
        startSeconds: lastPosition?.last_position,
      });
    }
  };

  const playPrevious = async () => {
    if (!playlistItems || currentIndexRef.current <= 0) return;

    currentIndexRef.current -= 1;
    const prevVideo = playlistItems.contents[currentIndexRef.current];
    const videoId = getVideoId(prevVideo.video_url);

    if (videoId && playerInstanceRef.current) {
      const lastPosition = await fetchWatchHistory(userid, prevVideo.id);
      playerInstanceRef.current.loadVideoById({
        videoId,
        startSeconds: lastPosition?.last_position || 0,
      });
    }
  };


  return (
    <>
      <div ref={playerContainerRef} className="w-full h-full relative" />
      <button onClick={playNext} className="absolute top-1/2 right-[55px] transform translate-x-1/2 w-[150px] h-[150px] transparent  -translate-y-1/2 border-3 border-red-700 
        p-4 rounded-full hover:bg-slate-100 transition-colors 
      ">Next</button>
      <button onClick={playPrevious} className="absolute top-1/2 -left-[50px] transform translate-x-1/2 w-[150px] h-[150px] transparent  -translate-y-1/2 border-3 border-red-700 
        p-4 rounded-full hover:bg-slate-100 transition-colors   
      ">Previous</button>
    </>
  )
};

export default VideoPlayer;
