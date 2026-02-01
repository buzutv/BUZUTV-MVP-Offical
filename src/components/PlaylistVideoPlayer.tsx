import React, { useEffect, useImperativeHandle, forwardRef, useRef, useState, memo, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getYouTubeEmbedUrl } from "@/utils/youtubeUtils";
import { useDispatch, useSelector } from "react-redux";
import { openScreenPlayer } from "@/store/screenPlayerSlice";
import { useUpsertWatchHistoryMutation } from "@/store/userWatchHistorySlice";

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

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
    onProgressUpdate?: (data: { id: string, watch_percentage: number, last_position: number }) => void;
    localProgress?: Record<string, { watch_percentage: number, last_position: number }>;
    onPlaylistAdvance?: () => void;
    completionThreshold?: number | null;
}

const VideoPlayer = forwardRef<any, VideoPlayerProps>(
    ({ videoId, playlistItems, setCurrentMovie, movieId, episodeId, setFinal, type, userid, playlistInfo, onProgressUpdate, localProgress, onPlaylistAdvance, completionThreshold }, ref) => {
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
        const handlersRef = useRef<any>(null);

        // Redux State
        const selectedVideo = useSelector((state: any) => state.screenPlayer.selectedVideo);
        const selectedVideoRef = useRef(selectedVideo);
        const playlistFullObject = useSelector((state: any) => state?.screenPlayer?.playlistInfo) || {};
        const seriesData = useSelector((state: any) => state?.screenPlayer?.seriesData);
        const isSeries = useSelector((state: any) => state?.screenPlayer?.isSeries) || false;

        // Flatten episodes if seriesData is an array of seasons
        const episodes = React.useMemo(() => {
            if (!isSeries || !seriesData) return [];
            if (Array.isArray(seriesData)) {
                return seriesData.flatMap(s => (s.episodes || []).map((ep: any) => ({
                    ...ep,
                    series_id: s.series_id || s.content_id // Ensure series_id is available
                })));
            }
            return seriesData.episodes || [];
        }, [seriesData, isSeries]);
        const currentVideoIndex = useSelector((state: any) => state?.screenPlayer?.currentVideoIndex) || 0

        // Playlist items from Redux - Handle array or object structure
        const playlist_items = Array.isArray(playlistFullObject)
            ? playlistFullObject[0]?.playlist_items
            : playlistFullObject?.playlist_items || [];

        // Determine current queue based on content type
        const currentQueue = isSeries ? episodes : playlist_items || [];

        // Refs for stable values in callbacks
        const isSeriesRef = useRef(isSeries);
        const currentVideoIndexRef = useRef(currentVideoIndex);
        const seriesDataRef = useRef(seriesData);
        const currentQueueRef = useRef(currentQueue);

        const [countdown, setCountdown] = useState(5);
        const [videoEnded, setVideoEnded] = useState(false);
        const [videoRestricted, setVideoRestricted] = useState(false);
        const [upsertWatchHistory] = useUpsertWatchHistoryMutation();

        const dispatch = useDispatch();

        // If we are in a series, we might have a next episode.
        // If not, we might have a next PLAYLIST item (handled via onPlaylistAdvance).
        // So hasNextVideo should form a composite check for UI purposes?
        // For now, let's keep it based on current queue, but maybe always show 'Next' if onPlaylistAdvance is present?
        // Actually, UI usually just hides the button if false.
        // Let's assume if it's the last episode, we can still click next to trigger playlist advance.
        const hasNextVideo = (currentQueue?.length > 0 && currentVideoIndex < currentQueue.length - 1) || (isSeries && !!onPlaylistAdvance);

        console.log("VideoPlayer State CurrentIndex", currentVideoIndex, currentQueue[currentVideoIndex])

        // --- SYNC REFS ---
        useEffect(() => {
            movieIdRef.current = movieId;
        }, [movieId]);

        useEffect(() => {
            episodeIdRef.current = episodeId;
        }, [episodeId]);

        useEffect(() => {
            videoIdRef.current = videoId;
            clearCountdownTimer();
            isCountdownStartedRef.current = false; // Reset when video changes
            wasThresholdReachedRef.current = false;
            wasCompletedSavedRef.current = false;
            setVideoEnded(false); // Ensure UI overlay is cleared
            setCountdown(5); // Reset countdown
        }, [videoId, selectedVideo]);

        useEffect(() => {
            selectedVideoRef.current = selectedVideo;
        }, [selectedVideo]);

        useEffect(() => {
            isSeriesRef.current = isSeries;
        }, [isSeries]);

        useEffect(() => {
            currentVideoIndexRef.current = currentVideoIndex;
        }, [currentVideoIndex]);

        useEffect(() => {
            currentQueueRef.current = currentQueue;
        }, [currentQueue]);

        useEffect(() => {
            seriesDataRef.current = seriesData;
        }, [seriesData]);

        useEffect(() => {
            completionThresholdRef.current = completionThreshold;
        }, [completionThreshold]);

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
            saveProgress: handleSaveProgress,
            replay: handleReplay
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

            // 1. Check local session progress first (highest priority)
            if (vidId && localProgress?.[vidId]) {
                const local = localProgress[vidId];
                console.log("Resuming from local progress:", local);
                if (local.watch_percentage < 99) { // Only resume if not almost done
                    return local.last_position;
                }
                return 0; // If they finished it locally, start over
            }

            // 2. Fallback to Redux state / DB history
            if (!currentVidData) {
                console.log("🔍 [VideoPlayer] No video data for resume calculation, using 0");
                return 0;
            }

            const history = Array.isArray(currentVidData.user_watch_history)
                ? currentVidData.user_watch_history[0]
                : currentVidData.user_watch_history;

            // Note: Some sources might have flatten values (watch_percentage) directly on currentVidData
            const isCompleted = currentVidData.completed || history?.completed;
            const watchPct = (currentVidData.watch_percentage !== undefined ? currentVidData.watch_percentage : history?.watch_percentage) || 0;
            const lastPos = (currentVidData.last_position !== undefined ? currentVidData.last_position : history?.last_position) || 0;

            console.log(`🔍 [VideoPlayer] Resume calculation for ${currentVidData.title}:`, {
                isCompleted,
                watchPct,
                lastPos,
                hasHistory: !!history
            });

            if (isCompleted || watchPct >= 95) {
                console.log("🔍 [VideoPlayer] Video previously completed or >95%, starting from beginning");
                return 0;
            } else if (lastPos > 0) {
                console.log(`🔍 [VideoPlayer] Resuming at ${lastPos}s (${watchPct}%)`);
                return lastPos;
            }

            console.log("🔍 [VideoPlayer] No previous progress found, starting from 0");
            return 0;
        }, [localProgress, selectedVideo]);

        const resumeVideoPosition = (player: any) => {
            const startSeconds = getResumePosition();
            console.log("Resuming to position:", startSeconds);
            player.seekTo(startSeconds, true);
            player.playVideo();
        };

        // --- INITIALIZE & UPDATE PLAYER ---
        useEffect(() => {
            if (!videoId) return;

            setVideoRestricted(false);
            const vid = getVideoId(videoId);
            console.log("Video Player Id", vid)
            if (!vid) {
                console.warn("VideoPlayer: Invalid video ID", videoId);
                return;
            }

            const startPos = getResumePosition();

            // If player exists, load new video
            if (playerInstanceRef.current) {
                try {
                    console.log("Loading videoById:", vid, "at position:", startPos);
                    playerInstanceRef.current.loadVideoById({
                        videoId: vid,
                        startSeconds: startPos
                    });
                    // Explicitly play to ensure autoplay follows through
                    setTimeout(() => {
                        playerInstanceRef.current?.playVideo();
                    }, 150);
                } catch (e) {
                    console.error("Error loading video", e);
                }
                return;
            }

            // Initialize YouTube API if not loaded
            if (!window.YT) {
                const tag = document.createElement("script");
                tag.src = "https://www.youtube.com/iframe_api";
                document.body.appendChild(tag);
            }

            const initPlayer = () => {
                if (playerInstanceRef.current) return;

                console.log("Initializing YouTube Player:", vid, "starting at:", startPos);

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
                            console.log(`✅ [VideoPlayer] YouTube Player Ready. Explicitly seeking to ${startPos}s`);
                            // Double reinforcement: ensure seek happens on ready
                            if (startPos > 0) {
                                e.target.seekTo(startPos, true);
                            }
                            e.target.playVideo();
                        },
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
        }, [videoId, getVideoId, userid, getResumePosition, selectedVideo]);

        const checkCompletionThreshold = useCallback(async () => {
            if (
                playerInstanceRef.current &&
                !isCountdownStartedRef.current &&
                !wasThresholdReachedRef.current
            ) {
                const currentTime = playerInstanceRef.current.getCurrentTime();
                const duration = playerInstanceRef.current.getDuration();
                const offset = completionThresholdRef.current || 0;
                const triggerPoint = Math.max(0, duration - offset);

                if (offset > 0 && duration > 0 && currentTime >= triggerPoint) {
                    console.log(`[VideoPlayer] Completion threshold reached: ${currentTime}s >= ${triggerPoint}s (Duration: ${duration}s, Offset: ${offset}s). Triggering end.`);

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

                    if (currentVideoIndexRef.current < currentQueueRef.current.length - 1) {
                        playerInstanceRef.current.seekTo(duration, true);
                        startCountdown();
                    } else {
                        // End of single video or playlist - pause to prevent flicker/grid
                        if (playerInstanceRef.current && playerInstanceRef.current.pauseVideo) {
                            playerInstanceRef.current.pauseVideo();
                        }
                        playerInstanceRef.current.seekTo(duration, true);
                        setVideoEnded(true);
                        setCountdown(0);
                    }
                }
            }
        }, [onProgressUpdate]);

        // --- EARLY COUNTDOWN POLLING ---
        useEffect(() => {
            const checkInterval = setInterval(async () => {
                if (
                    playerInstanceRef.current &&
                    playerInstanceRef.current.getPlayerState() === window.YT.PlayerState.PLAYING
                ) {
                    await checkCompletionThreshold();
                }
            }, 500);

            return () => clearInterval(checkInterval);
        }, [checkCompletionThreshold]);

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
                        // Don't set isCountdownStartedRef.current = false here yet, 
                        // the video change effect will reset it.
                        setVideoEnded(false);
                        // Use setTimeout to avoid calling playNext inside setState
                        setTimeout(() => playNext(), 0);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

        };

        const handleReplay = () => {
            console.log("VideoPlayer: handleReplay called");
            clearCountdownTimer();
            setVideoEnded(false);
            setCountdown(5); // Reset for next time
            isCountdownStartedRef.current = false;
            wasThresholdReachedRef.current = false;
            wasCompletedSavedRef.current = false;
            if (playerInstanceRef.current) {
                playerInstanceRef.current.seekTo(0, true);
                playerInstanceRef.current.playVideo();
            }
        };

        // --- NAVIGATION ---
        const playNext = () => {
            const currentIdx = currentVideoIndexRef.current;
            const queue = currentQueueRef.current;

            const nextIndex = currentIdx + 1;

            console.log("playNext triggering:", { currentIdx, nextIndex, queueLength: queue?.length });

            if (!queue || nextIndex >= queue.length) {
                if (isSeriesRef.current && onPlaylistAdvance) {
                    console.log("Attempting to advance playlist context...");
                    clearCountdownTimer();
                    setVideoEnded(false);
                    isCountdownStartedRef.current = false;
                    onPlaylistAdvance();
                } else {
                    setVideoEnded(true);
                    setCountdown(0);
                    isCountdownStartedRef.current = false;
                }
                return;
            }

            clearCountdownTimer();
            setVideoEnded(false);
            setVideoRestricted(false);
            isCountdownStartedRef.current = false; // Allow next countdown for new video

            // Get next item from queue
            const nextItem = queue[nextIndex];
            const isSer = isSeriesRef.current;

            // For series: episode object directly has video_url
            // For playlist: need to access .content
            const nextVideoData = isSer ? nextItem : nextItem?.content;

            if (!nextVideoData) {
                console.error("No video data found for next item");
                return;
            }

            console.log("Playing next in queue:", { nextIndex, nextVideoData, isSeries: isSer });

            // Update Redux with new video
            dispatch(openScreenPlayer({
                isOpen: true,
                currentVideoIndex: nextIndex,
                selectedVideo: nextVideoData,
                isSeries: isSer,
                seriesData: isSer ? seriesDataRef.current : undefined,
            }));

            if (setCurrentMovie) {
                setCurrentMovie(nextVideoData);
            }
        };

        const playPrevious = () => {
            const currentIdx = currentVideoIndexRef.current;
            const queue = currentQueueRef.current;

            if (!queue || currentIdx <= 0) return;

            clearCountdownTimer();
            setVideoEnded(false);
            setVideoRestricted(false);
            isCountdownStartedRef.current = false;

            const prevIndex = currentIdx - 1;
            const prevItem = queue[prevIndex];
            const isSer = isSeriesRef.current;
            const prevVideoData = isSer ? prevItem : prevItem?.content;

            if (!prevVideoData) {
                console.error("No video data found for previous item");
                return;
            }

            console.log("Playing previous:", { prevIndex, prevVideoData });

            dispatch(openScreenPlayer({
                isOpen: true,
                currentVideoIndex: prevIndex,
                selectedVideo: prevVideoData,
                isSeries: isSer,
                seriesData: isSer ? seriesDataRef.current : undefined,
            }));

            if (setCurrentMovie) {
                setCurrentMovie(prevVideoData);
            }
        };

        // --- EVENT HANDLERS ---
        const handlePlayerStateChange = async (e: any) => {
            const state = e.data;

            if (state === window.YT.PlayerState.PLAYING) {
                setVideoEnded(false);
                clearCountdownTimer();
                isCountdownStartedRef.current = false;
            }

            if (state === window.YT.PlayerState.ENDED) {
                // If we already handled this via threshold polling, don't repeat the logic
                if (wasThresholdReachedRef.current) return;

                // Prevent any auto-replay edge cases when the iframe reports ENDED
                // Save watch history
                await handleSaveProgress(true);

                const currentIdx = currentVideoIndexRef.current;
                const queueSize = currentQueueRef.current.length;

                // Check if there's a next video
                if (currentIdx < queueSize - 1) {
                    startCountdown();
                } else {
                    setVideoEnded(true);
                    setCountdown(0);
                }
            }

            // Always check threshold on state changes (handles seeks past threshold)
            if (state === window.YT.PlayerState.PAUSED || state === window.YT.PlayerState.ENDED) {
                await checkCompletionThreshold();
            }

            if (state === window.YT.PlayerState.PAUSED && !wasThresholdReachedRef.current && !wasCompletedSavedRef.current) {
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

        // Update handlersRef on every render to ensure YouTube event handlers always call the latest logic
        useEffect(() => {
            handlersRef.current = {
                onStateChange: handlePlayerStateChange,
                onError: handlePlayerError
            };
        });

        const handlePlayerError = (err: any) => {
            console.error("YouTube Player Error:", err.data);

            if (err.data === 150 || err.data === 101) {
                setVideoRestricted(true);

                if (currentVideoIndex < currentQueue.length - 1) {
                    startCountdown();
                }
            }
        };

        // --- CLEANUP ---
        useEffect(() => {
            return () => {
                if (playerInstanceRef.current) {
                    try {
                        playerInstanceRef.current.destroy();
                    } catch (e) {
                        console.error("Error destroying player", e);
                    }
                    playerInstanceRef.current = null;
                }
                clearCountdownTimer();
            };
        }, []);

        const hasPreviousVideo = currentVideoIndex > 0;
        const hasPlaylist = currentQueue.length > 1;

        return (
            <div className="relative w-full h-full bg-black">
                {/* Restricted Video Overlay */}
                {videoRestricted && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 text-white">
                        <p className="text-xl mb-4">This video is restricted or unavailable</p>
                        <p className="text-sm">
                            {hasNextVideo ? `Skipping to next video in ${countdown} seconds...` : "No more videos available"}
                        </p>
                    </div>
                )}

                {/* Countdown Overlay */}
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

                {/* Replay Overlay (End of Content) */}
                {videoEnded && countdown === 0 && (
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

                {/* Player Container */}
                <div className="w-full h-full">
                    <div ref={playerContainerRef} className="w-full h-full" />
                </div>

                {/* Navigation Controls */}
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

function propsAreEqual(prev: VideoPlayerProps, next: VideoPlayerProps) {
    // Re-render if video ID changes
    if (prev.videoId !== next.videoId) return false;

    return (
        prev.movieId === next.movieId &&
        prev.episodeId === next.episodeId &&
        prev.playlistInfo?.current === next.playlistInfo?.current
    );
}

export default memo(VideoPlayer, propsAreEqual);