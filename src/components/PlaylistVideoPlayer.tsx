import React, { useEffect, useImperativeHandle, forwardRef, useRef, useState, memo, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getYouTubeEmbedUrl, saveWatchHistory, fetchSeriesSeasons } from "@/utils/youtubeUtils";
import { useDispatch, useSelector } from "react-redux";
import { openScreenPlayer, setSeriesData } from "@/store/screenPlayerSlice";

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

interface PlaylistVideoPlayerProps {
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
    localProgress?: Record<string, { watch_percentage: number, last_position: number }>;
    onPlaylistAdvance?: () => void;
}

const PlaylistVideoPlayer = forwardRef<any, PlaylistVideoPlayerProps>(
    ({ videoId, playlistItems, setCurrentMovie, movieId, episodeId, setFinal, type, userid, playlistInfo, onProgressUpdate, localProgress, onPlaylistAdvance }, ref) => {
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
        const seriesData = useSelector((state: any) => state?.screenPlayer?.seriesData) || {};
        const episodes = useSelector((state: any) => state?.screenPlayer?.seriesData?.episodes) || [];
        const isSeries = useSelector((state: any) => state?.screenPlayer?.isSeries) || false;
        const currentVideoIndex = useSelector((state: any) => state?.screenPlayer?.currentVideoIndex) || 0;

        // Refs for playlist data to avoid stale closures in callbacks
        const playlistItemsRef = useRef<any[]>([]);
        const episodesRef = useRef<any[]>([]);
        const currentQueueRef = useRef<any[]>([]);
        const isSeriesRef = useRef(isSeries);
        const currentVideoIndexRef = useRef(currentVideoIndex);
        const seriesDataRef = useRef(seriesData);

        const [countdown, setCountdown] = useState(5);
        const [videoEnded, setVideoEnded] = useState(false);
        const [videoRestricted, setVideoRestricted] = useState(false);

        const dispatch = useDispatch();

        // Playlist items from Redux - Handle array or object structure
        const playlist_items = Array.isArray(playlistFullObject)
            ? playlistFullObject[0]?.playlist_items
            : playlistFullObject?.playlist_items || [];

        // Determine current queue based on content type
        const currentQueue = isSeries ? episodes : playlist_items || [];

        // Sync refs with state/props
        useEffect(() => {
            playlistItemsRef.current = playlist_items;
            episodesRef.current = episodes;
            currentQueueRef.current = currentQueue;
            isSeriesRef.current = isSeries;
            currentVideoIndexRef.current = currentVideoIndex;
            seriesDataRef.current = seriesData;
        }, [playlist_items, episodes, currentQueue, isSeries, currentVideoIndex, seriesData]);

        // Check if there is more content in the current localized queue (episodes or playlist movies)
        const hasNextInQueue = currentQueue?.length > 0 && currentVideoIndex < currentQueue.length - 1;

        // Check if we can advance the playlist context (from series to next item, or movie to next item)
        // We do a global check against the playlist_items to see if there is a next context available.
        const currentIdForGlobalCheck = isSeries ? (selectedVideo?.series_id || selectedVideo?.id) : selectedVideo?.id;
        const currentGlobalIndex = (playlist_items || []).findIndex((item: any) => {
            const itemId = item.content?.id || item.id;
            return itemId === currentIdForGlobalCheck;
        });
        const hasNextGlobalItem = currentGlobalIndex !== -1 && currentGlobalIndex < (playlist_items?.length || 0) - 1;

        // hasNextVideo should be true if we have a next episode OR a next item in the playlist
        const hasNextVideo = hasNextInQueue || hasNextGlobalItem;

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
            const vidId = currentVidData?.id;

            if (vidId && localProgress?.[vidId]) {
                const local = localProgress[vidId];
                if (local.watch_percentage < 95) {
                    return local.last_position;
                }
                return 0;
            }

            if (!currentVidData) return 0;

            const history = Array.isArray(currentVidData.user_watch_history)
                ? currentVidData.user_watch_history[0]
                : currentVidData.user_watch_history;

            const isCompleted = currentVidData.completed || history?.completed;
            const watchPct = currentVidData.watch_percentage || history?.watch_percentage || 0;
            const lastPos = currentVidData.last_position || history?.last_position || 0;

            if (isCompleted || watchPct >= 95) {
                return 0;
            } else if (lastPos > 0) {
                return lastPos;
            }
            return 0;
        }, [localProgress]);

        // --- INITIALIZE & UPDATE PLAYER ---
        useEffect(() => {
            if (!videoId) return;

            setVideoRestricted(false);
            const vid = getVideoId(videoId);

            if (!vid) return;

            const startPos = getResumePosition();

            if (playerInstanceRef.current) {
                try {
                    playerInstanceRef.current.loadVideoById({
                        videoId: vid,
                        startSeconds: startPos
                    });
                } catch (e) {
                    console.error("Error loading video", e);
                }
                return;
            }

            if (!window.YT) {
                const tag = document.createElement("script");
                tag.src = "https://www.youtube.com/iframe_api";
                document.body.appendChild(tag);
            }

            const initPlayer = () => {
                if (playerInstanceRef.current) return;

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
                        setTimeout(() => playNext(), 0);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        };

        const handleReplay = () => {
            setVideoEnded(false);
            setCountdown(5);
            playerInstanceRef.current?.seekTo(0);
            playerInstanceRef.current?.playVideo();
        };

        // --- NAVIGATION ---
        const playNext = async () => {
            const currentQueue = currentQueueRef.current;
            const currentIndex = currentVideoIndexRef.current;
            const isSeries = isSeriesRef.current;
            const playlist_items = playlistItemsRef.current;

            const nextIndex = currentIndex + 1;

            // 1. Logic for WITHIN the current queue (next episode OR next playlist movie)
            if (currentQueue && nextIndex < currentQueue.length) {
                clearCountdownTimer();
                setVideoEnded(false);
                setVideoRestricted(false);

                const nextItem = currentQueue[nextIndex];
                const nextVideoData = isSeries ? nextItem : (nextItem?.content || nextItem);

                if (!nextVideoData) return;

                // Handle transition TO a series from a movie in a playlist
                if (!isSeries && nextVideoData.type === 'series') {
                    const seasonsData = await fetchSeriesSeasons(nextVideoData.id);
                    if (seasonsData && seasonsData.length > 0) {
                        const firstSeason = seasonsData[0] as any;
                        const firstEpisode = firstSeason.episodes?.[0];
                        if (firstEpisode) {
                            dispatch(openScreenPlayer({
                                isOpen: true,
                                currentVideoIndex: 0,
                                selectedVideo: firstEpisode,
                                isSeries: true,
                                seriesData: firstSeason,
                                // Persist playlistInfo if possible or it will come from Redux
                            }));
                            if (setCurrentMovie) setCurrentMovie(firstEpisode);
                            return;
                        }
                    }
                }

                dispatch(openScreenPlayer({
                    isOpen: true,
                    currentVideoIndex: nextIndex,
                    selectedVideo: nextVideoData,
                    isSeries: isSeries,
                    seriesData: isSeries ? seriesDataRef.current : undefined,
                }));

                if (setCurrentMovie) {
                    setCurrentMovie(nextVideoData);
                }
                return;
            }

            // 2. Logic for CROSSING queue boundaries (end of series -> next playlist item)
            if (isSeries) {
                // Find next item in global playlist
                const currentId = selectedVideoRef.current?.series_id || selectedVideoRef.current?.id;
                const currentGlobalIndex = playlist_items.findIndex((item: any) => {
                    const itemId = item.content?.id || item.id;
                    return itemId === currentId;
                });

                if (currentGlobalIndex !== -1 && currentGlobalIndex < playlist_items.length - 1) {
                    clearCountdownTimer();
                    setVideoEnded(false);
                    // This callback in ScreenPlayer.tsx handles the heavy lifting for playlist advancement
                    if (onPlaylistAdvance) {
                        onPlaylistAdvance();
                    } else {
                        // Plan B: Manual advance if callback is missing
                        const nextPlaylistItem = playlist_items[currentGlobalIndex + 1];
                        const nextContent = nextPlaylistItem.content || nextPlaylistItem;

                        if (nextContent.type === 'series') {
                            const seasonsData = await fetchSeriesSeasons(nextContent.id);
                            if (seasonsData && seasonsData.length > 0) {
                                const firstSeason = seasonsData[0] as any;
                                const firstEpisode = firstSeason.episodes?.[0];
                                if (firstEpisode) {
                                    dispatch(openScreenPlayer({
                                        isOpen: true,
                                        currentVideoIndex: 0,
                                        selectedVideo: firstEpisode,
                                        isSeries: true,
                                        seriesData: firstSeason,
                                    }));
                                    if (setCurrentMovie) setCurrentMovie(firstEpisode);
                                }
                            }
                        } else {
                            dispatch(openScreenPlayer({
                                isOpen: true,
                                currentVideoIndex: currentGlobalIndex + 1,
                                selectedVideo: nextContent,
                                isSeries: false,
                            }));
                            if (setCurrentMovie) setCurrentMovie(nextContent);
                        }
                    }
                    return;
                }
            }

            // 3. End of Playlist
            setVideoEnded(true);
            setCountdown(0);
        };

        const playPrevious = () => {
            if (!currentQueue || currentVideoIndex <= 0) return;

            clearCountdownTimer();
            setVideoEnded(false);
            setVideoRestricted(false);

            const prevIndex = currentVideoIndex - 1;
            const prevItem = currentQueue[prevIndex];
            const prevVideoData = isSeries ? prevItem : (prevItem?.content || prevItem);

            if (!prevVideoData) return;

            dispatch(openScreenPlayer({
                isOpen: true,
                currentVideoIndex: prevIndex,
                selectedVideo: prevVideoData,
                isSeries: prevVideoData.type === 'series' || isSeries,
                seriesData: isSeries ? seriesData : undefined,
            }));

            if (setCurrentMovie) {
                setCurrentMovie(prevVideoData);
            }
        };

        // --- EVENT HANDLERS ---
        const handlePlayerStateChange = async (e: any) => {
            const state = e.data;

            if (state === window.YT.PlayerState.ENDED) {
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

                if (hasNextVideo) {
                    startCountdown();
                } else {
                    setVideoEnded(true);
                    setCountdown(0);
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
            if (err.data === 150 || err.data === 101) {
                setVideoRestricted(true);
                if (hasNextVideo) {
                    startCountdown();
                }
            }
        };

        useEffect(() => {
            return () => {
                if (playerInstanceRef.current) {
                    try {
                        playerInstanceRef.current.destroy();
                    } catch (e) { }
                    playerInstanceRef.current = null;
                }
                clearCountdownTimer();
            };
        }, []);

        const hasPreviousVideo = currentVideoIndex > 0;
        const hasPlaylist = currentQueue.length > 1;

        return (
            <div className="relative w-full h-full bg-black">
                {videoRestricted && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 text-white">
                        <p className="text-xl mb-4">This video is restricted or unavailable</p>
                        <p className="text-sm">
                            {hasNextVideo ? `Skipping to next video in ${countdown} seconds...` : "No more videos available"}
                        </p>
                    </div>
                )}

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

                <div className="w-full h-full">
                    <div ref={playerContainerRef} className="w-full h-full" />
                </div>

                {(isSeries || hasPlaylist) && (
                    <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-black/70 px-6 py-3 rounded-full">
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

function propsAreEqual(prev: any, next: any) {
    if (prev.videoId !== next.videoId) return false;
    return (
        prev.movieId === next.movieId &&
        prev.episodeId === next.episodeId &&
        prev.playlistInfo?.current === next.playlistInfo?.current
    );
}

export default memo(PlaylistVideoPlayer, propsAreEqual);
