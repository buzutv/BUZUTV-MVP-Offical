import React, { useEffect, useImperativeHandle, forwardRef, useRef, useState, memo, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getYouTubeEmbedUrl, saveWatchHistory, fetchSeriesSeasons } from "@/utils/youtubeUtils";
import { useDispatch, useSelector } from "react-redux";
import { openScreenPlayer, setSeriesData } from "@/store/screenPlayerSlice";
import { useUpsertWatchHistoryMutation } from "@/store/userWatchHistorySlice";
import { useGetPlaylistContentWithWatchHistoryQuery } from "@/store/contentSlice";

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
    playlistId?: string;
    completionThreshold?: number | null;
}

const PlaylistVideoPlayer = forwardRef<any, PlaylistVideoPlayerProps>(
    ({ videoId, playlistItems, setCurrentMovie, movieId, episodeId, setFinal, type, userid, playlistInfo, onProgressUpdate, localProgress, onPlaylistAdvance, playlistId, completionThreshold }, ref) => {
        const playerContainerRef = useRef<HTMLDivElement>(null);
        const playerInstanceRef = useRef<any>(null);

        // Refs for props to avoid stale closures
        const movieIdRef = useRef(movieId);
        const episodeIdRef = useRef(episodeId);
        const videoIdRef = useRef(videoId);
        const countdownRef = useRef<any>(null);
        const isCountdownStartedRef = useRef(false);
        const completionThresholdRef = useRef(completionThreshold);
        const wasThresholdReachedRef = useRef(false);
        const wasCompletedSavedRef = useRef(false);

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

        const [countdown, setCountdown] = useState(0); // Initialize at 0 so it doesn't trigger effect initially
        const [videoEnded, setVideoEnded] = useState(false);
        const [videoRestricted, setVideoRestricted] = useState(false);
        const [upsertWatchHistory] = useUpsertWatchHistoryMutation();

        // --- SESSION REFS TO PREVENT STALE CLOSURES ---
        const handlersRef = useRef<any>(null);
        const sessionPlaylistRef = useRef<any[]>([]);

        // Playlist items from Redux - Handle array or object structure
        const playlist_items = Array.isArray(playlistFullObject)
            ? playlistFullObject[0]?.playlist_items
            : playlistFullObject?.playlist_items || [];

        // RTK Query for playlist contents with history
        const playlistContentIds = (playlist_items || []).map((item: any) => item.content?.id || item.id);
        const { data: refreshedItems } = useGetPlaylistContentWithWatchHistoryQuery(
            { userId: userid, contentIds: playlistContentIds },
            { skip: !playlistId || !userid || playlistContentIds.length === 0 }
        );

        const dispatch = useDispatch();

        // Initialize session ref with available items initially
        useEffect(() => {
            if (playlist_items && playlist_items.length > 0 && sessionPlaylistRef.current.length === 0) {
                sessionPlaylistRef.current = playlist_items;
            }
        }, [playlist_items]);

        // Sync refreshed items to session ref for stable callback access
        useEffect(() => {
            if (refreshedItems && refreshedItems.length > 0) {
                sessionPlaylistRef.current = refreshedItems;
                console.log('PlaylistVideoPlayer: Session playlist updated reactively:', refreshedItems.length);
            }
        }, [refreshedItems]);

        // Helper to check for next video using ONLY the latest ref values (Reliable in callbacks)
        const checkHasNextVideo = useCallback(() => {
            const playlist = sessionPlaylistRef.current;
            const currentQueue = currentQueueRef.current;
            const currentIdx = currentVideoIndexRef.current;

            // 1. Check strict queue index first (most reliable source of truth)
            if (currentQueue && currentQueue.length > 0) {
                // If we are not at the last item, there is a next video
                if (currentIdx < currentQueue.length - 1) {
                    return true;
                }
            }

            // 2. If we are at the end of the current queue...
            // If the current queue is just episodes, check if there's another item in the global playlist
            // But if the current queue IS the playlist (movies), then we are done.
            if (!isSeriesRef.current) {
                // We are at the end of the playlist queue
                return false;
            }

            // 3. For Series: Check global playlist session if we are at the end of episodes
            const currentVidId = selectedVideoRef.current?.id || movieIdRef.current;
            if (playlist && playlist.length > 0) {
                // Determine current playlist index rigidly 
                // Note: contentIds in playlist usually match the "series" ID, not the episode ID.
                const seriesId = seriesDataRef.current?.series_id;
                // Fallback to searching playlist for the current series/video
                const globalIdx = playlist.findIndex((item: any) => {
                    const itemId = item?.id || item?.content?.id;
                    const contentIdOfSeries = seriesDataRef.current?.id; // Season ID? No. 
                    // Best effort to find where we are in the main playlist:
                    return itemId === currentVidId || (seriesId && itemId === seriesId);
                });

                return globalIdx !== -1 && globalIdx < playlist.length - 1;
            }

            return false;
        }, []);

        // Derive state for UI from the latest ref-based check
        const hasNextVideo = checkHasNextVideo();

        // Determine current queue based on content type
        const currentQueue = isSeries ? episodes : playlist_items || [];
        console.log("Playlist Items", playlist_items)
        // Sync refs with state/props
        useEffect(() => {
            playlistItemsRef.current = playlist_items;
            episodesRef.current = episodes;
            currentQueueRef.current = currentQueue;
            isSeriesRef.current = isSeries;
            currentVideoIndexRef.current = currentVideoIndex;
            seriesDataRef.current = seriesData;
        }, [playlist_items, episodes, currentQueue, isSeries, currentVideoIndex, seriesData]);

        useEffect(() => {
            completionThresholdRef.current = completionThreshold;
        }, [completionThreshold]);


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
            wasThresholdReachedRef.current = false;
            wasCompletedSavedRef.current = false;
            setVideoEnded(false); // Ensure UI overlay is cleared
        }, [videoId]);

        useEffect(() => {
            selectedVideoRef.current = selectedVideo;
        }, [selectedVideo]);

        const handleSaveProgress = async (isCompOverride?: boolean) => {
            if (playerInstanceRef.current && playerInstanceRef.current.getCurrentTime) {
                const duration = playerInstanceRef.current.getDuration() || 1;
                const current = playerInstanceRef.current.getCurrentTime() || 0;
                const isComp = isCompOverride ?? (wasThresholdReachedRef.current || wasCompletedSavedRef.current);
                const watchPercentage = isComp ? 100 : Math.floor((current / duration) * 100);

                await upsertWatchHistory({
                    userId: userid,
                    movieId: episodeIdRef.current ? undefined : movieIdRef.current,
                    episodeId: episodeIdRef.current || undefined,
                    data: {
                        watched_at: new Date().toISOString(),
                        last_position: isComp ? 0 : Math.floor(current),
                        watch_percentage: watchPercentage,
                        completed: isComp,
                    }
                }).unwrap().catch(err => console.error("Error saving watch history:", err));
            }
        };

        // --- EXPOSE METHODS VIA REF ---
        useImperativeHandle(ref, () => ({
            play: () => playerInstanceRef.current?.playVideo(),
            pause: () => playerInstanceRef.current?.pauseVideo(),
            getDuration: () => playerInstanceRef.current?.getDuration(),
            saveProgress: handleSaveProgress
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
            const currentVidId = selectedVideoRef.current?.id || movieIdRef.current;

            // Check session ref first (has latest fetched history)
            if (sessionPlaylistRef.current.length > 0) {
                const itemFromSession = sessionPlaylistRef.current.find(item => (item.id || item.content?.id) === currentVidId);
                if (itemFromSession) {
                    const history = Array.isArray(itemFromSession.user_watch_history)
                        ? itemFromSession.user_watch_history[0]
                        : itemFromSession.user_watch_history;

                    // Use flattened values or nested history
                    const isCompleted = itemFromSession.completed || history?.completed;
                    const watchPct = itemFromSession.watch_percentage || history?.watch_percentage || 0;
                    const lastPos = itemFromSession.last_position || history?.last_position || 0;

                    console.log(`Resuming from session ref for ${itemFromSession.title}:`, { lastPos, watchPct, isCompleted });

                    if (isCompleted || watchPct >= 95) {
                        return 0;
                    } else if (lastPos > 0) {
                        return lastPos;
                    }
                }
            }

            const currentVidData = selectedVideoRef.current;
            const vidId = currentVidData?.id || movieIdRef.current;

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
        }, [localProgress, selectedVideo]);

        // --- NAVIGATION (Moved up so it's defined before usage) ---
        const playNext = useCallback(async () => {
            const playlist = sessionPlaylistRef.current;
            const currentVidId = selectedVideoRef.current?.id || movieIdRef.current;
            const currentQueue = currentQueueRef.current;
            const isSeries = isSeriesRef.current;
            const currentIdx = currentVideoIndexRef.current;

            console.log("PlayNext called. Index:", currentIdx, "Queue length:", currentQueue.length);

            // 1. Strict Queue Navigation (Most Common)
            const nextIndexInQueue = currentIdx + 1;
            if (nextIndexInQueue < currentQueue.length) {
                console.log("Playing next item in strict queue:", nextIndexInQueue);

                clearCountdownTimer();
                setVideoEnded(false);
                setVideoRestricted(false);

                const nextItem = currentQueue[nextIndexInQueue];

                // If we have refreshed data in session ref, use it for Correct Resume Position
                const refreshedNextItem = playlist.find(item => (item.id || item.content?.id) === (nextItem.id || nextItem.content?.id));
                const nextVideoData = isSeries ? nextItem : (refreshedNextItem || nextItem?.content || nextItem);

                if (!nextVideoData) {
                    console.error("Next video data missing!");
                    return;
                }

                // Handle transition TO a series from a movie in a playlist
                if (!isSeries && nextVideoData.type === 'series') {
                    // ... (Logic for handling series transition remains same)
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
                            }));
                            if (setCurrentMovie) setCurrentMovie(firstEpisode);
                            return;
                        }
                    }
                }

                dispatch(openScreenPlayer({
                    isOpen: true,
                    currentVideoIndex: nextIndexInQueue,
                    selectedVideo: nextVideoData,
                    isSeries: isSeries,
                    seriesData: isSeries ? seriesDataRef.current : undefined,
                }));

                if (setCurrentMovie) {
                    setCurrentMovie(nextVideoData);
                }
                return;
            }

            // 2. Logic for Crossing Boundaries (Series finished -> Back to Playlist)
            // Only applicable if we are in a series and want to go to the next playlist item
            if (isSeries && playlist && playlist.length > 0) {
                const seriesId = seriesDataRef.current?.series_id || selectedVideoRef.current?.series_id;
                const currentIndexInPlaylist = playlist.findIndex((item: any) => {
                    const itemId = item?.id || item?.content?.id;
                    return itemId === seriesId || itemId === currentVidId;
                });

                if (currentIndexInPlaylist !== -1 && currentIndexInPlaylist < playlist.length - 1) {
                    console.log("Series ended, moving to next playlist item at index:", currentIndexInPlaylist + 1);

                    clearCountdownTimer();
                    setVideoEnded(false);
                    setVideoRestricted(false);

                    const nextPlaylistItem = playlist[currentIndexInPlaylist + 1];
                    const nextContent = nextPlaylistItem.content || nextPlaylistItem;

                    if (nextContent.type === 'series') {
                        // ... similar transition logic
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
                            currentVideoIndex: currentIndexInPlaylist + 1,
                            selectedVideo: nextContent,
                            isSeries: false,
                        }));
                        if (setCurrentMovie) setCurrentMovie(nextContent);
                    }
                    return;
                }
            }

            // 3. End of Playlist
            console.log("End of playlist reached. Showing End Screen.");
            setVideoEnded(true);
            setCountdown(0);
        }, [dispatch, setCurrentMovie, onPlaylistAdvance]);


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
                    // Just decrement here, handle logic in useEffect
                    if (prev <= 0) return 0;
                    return prev - 1;
                });
            }, 1000);
        };

        // --- COUNTDOWN COMPLETION EFFECT (FIXED) ---
        // This ensures playNext fires cleanly when countdown hits 0
        useEffect(() => {
            if (isCountdownStartedRef.current && countdown === 0 && videoEnded) {
                clearCountdownTimer();
                isCountdownStartedRef.current = false;
                // Use setTimeout to allow state updates to settle
                setTimeout(() => {
                    playNext();
                }, 0);
            }
        }, [countdown, videoEnded, playNext]);


        // --- EARLY COUNTDOWN POLLING ---
        useEffect(() => {
            const checkThreshold = setInterval(async () => {
                if (
                    playerInstanceRef.current &&
                    playerInstanceRef.current.getPlayerState() === window.YT.PlayerState.PLAYING &&
                    !isCountdownStartedRef.current
                ) {
                    const currentTime = playerInstanceRef.current.getCurrentTime();
                    const duration = playerInstanceRef.current.getDuration();
                    const offset = completionThresholdRef.current || 0;
                    const triggerPoint = Math.max(0, duration - offset);

                    if (offset > 0 && duration > 0 && currentTime >= triggerPoint) {
                        console.log(`[PlaylistVideoPlayer] Completion threshold reached: ${currentTime}s >= ${triggerPoint}s (Duration: ${duration}s, Offset: ${offset}s). Triggering end.`);

                        wasThresholdReachedRef.current = true;
                        wasCompletedSavedRef.current = true;

                        // Save as completed
                        await handleSaveProgress(true);

                        if (onProgressUpdate) {
                            onProgressUpdate({
                                id: episodeIdRef.current || movieIdRef.current,
                                watch_percentage: 100,
                                last_position: 0
                            });
                        }

                        if (checkHasNextVideo()) {
                            playerInstanceRef.current.seekTo(duration, true);
                            startCountdown();
                        } else {
                            if (playerInstanceRef.current && playerInstanceRef.current.pauseVideo) {
                                playerInstanceRef.current.pauseVideo();
                            }
                            playerInstanceRef.current.seekTo(duration, true);
                            setVideoEnded(true);
                            setCountdown(0);
                        }
                    }
                }
            }, 1000);

            return () => clearInterval(checkThreshold);
        }, [checkHasNextVideo, type, userid]);

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
                    // FIX: Explicitly play video when loading a new one to ensure autoplay works
                    // despite overlay state changes
                    setTimeout(() => {
                        playerInstanceRef.current?.playVideo();
                    }, 100);
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
                        // INTERCEPT: Use a stable handler that delegates to the latest ref'd handler
                        onStateChange: (e: any) => handlersRef.current?.onStateChange(e),
                        onError: (e: any) => handlersRef.current?.onError(e),
                    },
                });
            };

            if (window.YT && window.YT.Player) {
                initPlayer();
            } else {
                (window as any).onYouTubeIframeAPIReady = initPlayer;
            }
        }, [videoId, getVideoId, userid, getResumePosition]);

        const handleReplay = () => {
            setVideoEnded(false);
            setCountdown(5); // Reset visual
            isCountdownStartedRef.current = false; // Reset logical
            playerInstanceRef.current?.seekTo(0);
            playerInstanceRef.current?.playVideo();
        };

        const playPrevious = () => {
            if (!currentQueue || currentVideoIndex <= 0) return;

            clearCountdownTimer();
            setVideoEnded(false);
            setVideoRestricted(false);
            isCountdownStartedRef.current = false;

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
                if (wasThresholdReachedRef.current) return;

                await handleSaveProgress(true);

                if (checkHasNextVideo()) {
                    startCountdown();
                } else {
                    setVideoEnded(true);
                    setCountdown(0);
                }
            }

            if (state === window.YT.PlayerState.PAUSED && !wasThresholdReachedRef.current && !wasCompletedSavedRef.current) {
                // ... (Existing logic same as before)
                await handleSaveProgress(false);
                if (onProgressUpdate && !wasThresholdReachedRef.current) {
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

            if (state === window.YT.PlayerState.BUFFERING && !wasThresholdReachedRef.current && !wasCompletedSavedRef.current) {
                // ... (Existing logic same as before)
                const currentTime = e.target.getCurrentTime();
                if (currentTime > 1) {
                    if (setFinal) setFinal(currentTime);
                    await handleSaveProgress(false);
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

        // Update handlersRef on every render to ensure YouTube event handlers always call the latest logic
        useEffect(() => {
            handlersRef.current = {
                onStateChange: handlePlayerStateChange,
                onError: handlePlayerError
            };
        });

        useEffect(() => {
            return () => {
                // Cleanup player on unmount only if strictly necessary, 
                // but usually better to leave it unless component is fully destroyed
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
                                // Logic handled in useEffect now
                            }}
                            className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition"
                        >
                            Play Now
                        </button>
                    </div>
                )}

                {videoEnded && countdown === 0 && !hasNextVideo && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-3xl text-white animate-in fade-in zoom-in duration-500">
                        <h2 className="text-5xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Thanks for watching!</h2>
                        {/* <button
                            onClick={handleReplay}
                            className="px-8 py-3 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition transform hover:scale-110 shadow-lg hover:shadow-xl hover:shadow-white/20"
                        >
                            Replay Video
                        </button> */}
                    </div>
                )}

                <div className="w-full h-full">
                    <div ref={playerContainerRef} className="w-full h-full" />
                </div>

                {((isSeries && currentQueue.length > 0) || hasPlaylist) && (
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