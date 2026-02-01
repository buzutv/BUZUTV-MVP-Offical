import { fetchSeriesSeasons, fetchWatchHistory, getOptimizedImageUrl, getRecommendedMovies, getYouTubeEmbedUrl, saveWatchHistory } from "@/utils/youtubeUtils";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import SearchBar from "./SearchBar";
import VideoPlayer from "./VideoPlayer";
import PlaylistVideoPlayer from "./PlaylistVideoPlayer";
import usePlaylists from "@/hooks/usePlaylists";
import RecommendedSection from "./RecommendedSection";
import { useLazyGetRecommendationsWtihContentEmbeddedQuery, useLazyGetUserRecommendationsQuery } from "@/store/recommendationSlice";

import { Episode, FullscreenPlayerProps } from "@/types";
import MovieDetailSection from "./MovieDetailSection";
import { useLazyGetContentWithWatchHistoryFiltersQuery, useLazyGetPlaylistContentWithWatchHistoryQuery, useLazyGetSearchContentWithWatchHistoryQuery } from "@/store/contentSlice";
import RelatedContent from "./RelatedContent";
import AdToast from "./AdToast";
import { useDispatch, useSelector } from "react-redux";
import { openScreenPlayer, closeScreenPlayer } from "@/store/screenPlayerSlice";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useContent } from "@/hooks/useContent";
import ProtectedRoute from "./auth/ProtectedRoute";
//comment
//comment 
//
const FullscreenPlayer = ({
  isOpen,
  onClose,
  videoUrl,
  title,
  userId,
  type,
  season,
  setSelectedVideo,
  onVideoEnd,
  movieId,
  poster_url,
  // video,
  hasNext = false,
  hasPrevious = false,
  onNext,
  onPrevious,
  playlistInfo,
  playlistId
}: FullscreenPlayerProps) => {

  const playerRef = useRef<HTMLDivElement>()
  const [movieid, setMovieid] = useState<string>(movieId)
  const [duration, setDuration] = useState(0);
  const [movies, setMovies] = useState<any[]>([]);
  const [videoEnded, setVideoEnded] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  // const currentMovie = movies[0];
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [relatedContent, setRelatedContent] = useState<any[]>([]);
  const [currentMovie, setCurrentMovie] = useState<any>(null);
  const navigate = useNavigate();
  const [final, setFinal] = useState(0);
  const [video_id, setVideoId] = useState<string>("");
  const { user } = useAuth()
  // Refs to hold latest values for callbacks to avoid dependency cycles
  const moviesRef = useRef(movies);
  const durationRef = useRef(duration);
  const currentMovieIdRef = useRef<string | null>(null);
  const playlistRef = useRef<string>("")
  const { refetch: refetchContentWithWatchHistory } = useContent()
  // Episode selection state for series
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [showAd, setShowAd] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [actualVideoUrl, setActualVideoUrl] = useState(videoUrl);
  const id = useParams()
  const { triggerPlaylistWithItemsById } = usePlaylists()
  const [playlists, setPlaylists] = useState<any[]>([])
  // const { refetch } = usePlaylists()
  const [recommended, setRecommended] = useState<any[]>([])
  // const [seasons, setSeasons] = useState<any[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  // Sync refs with state
  const parentRef = useRef()
  const dispatch = useDispatch();
  // const navigate = useNavigate();
  const [triggerRecommendations, resultRecommendations] = useLazyGetRecommendationsWtihContentEmbeddedQuery();
  const [triggerRelatedContent, resultRelatedContent] = useLazyGetContentWithWatchHistoryFiltersQuery();
  const selectedContent = useSelector((state: any) => state.screenPlayer.selectedVideo);
  const reduxVideoUrl = useSelector((state: any) => state.screenPlayer.videoUrl);
  const [triggerGetContentWithWatchHistory, result] = useLazyGetPlaylistContentWithWatchHistoryQuery()
  const isSeries = useSelector((state: any) => state.screenPlayer.isSeries);
  const contentIds = useSelector((state: any) => state.screenPlayer.playlistInfo);
  const seriesContentId = useSelector((state: any) => state.screenPlayer.contentId);
  const seriesPosterUrl = useSelector((state: any) => state.screenPlayer.poster_url);
  const seriesDataFromRedux = useSelector((state: any) => state.screenPlayer.seriesData);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [triggerGetSearchContentWithWatchHistory, resultGetSearchContentWithWatchHistory] = useLazyGetSearchContentWithWatchHistoryQuery()
  console.log("Selected Content from Redux in FullscreenPlayer:", movieId);
  const [localProgress, setLocalProgress] = useState<Record<string, { watch_percentage: number, last_position: number }>>({});

  const handleProgressUpdate = (data: { id: string, watch_percentage: number, last_position: number }) => {
    setLocalProgress(prev => ({
      ...prev,
      [data.id]: {
        watch_percentage: data.watch_percentage,
        last_position: data.last_position
      }
    }));
  };

  // Callback to advance to the next item in the playlist (e.g. after a series finishes)
  const handlePlaylistAdvance = async () => {
    console.log("Handling playlist advance...");
    const playlistItems = Array.isArray(contentIds) ? contentIds[0]?.playlist_items : contentIds?.playlist_items || [];

    if (!playlistItems || playlistItems.length === 0) {
      console.log("No playlist items to advance to.");
      return;
    }

    // Find current index based on the *parent* content ID (movie ID or series ID)
    // If we are deep in a series, selectedContent might be an episode, so we check series_id
    const currentId = isSeries ? (selectedContent?.series_id || selectedContent?.id) : selectedContent?.id;

    // Note: playlistItems structure depends on the join. Usually it has 'content' object or is the content object.
    const currentIndex = playlistItems.findIndex((item: any) => {
      const itemId = item.content?.id || item.id;
      return itemId === currentId;
    });

    console.log("Playlist Advance Debug:", { currentId, currentIndex, total: playlistItems.length });

    if (currentIndex === -1 || currentIndex >= playlistItems.length - 1) {
      console.log("End of playlist or current item not found.");
      return;
    }

    const nextItemWrapper = playlistItems[currentIndex + 1];
    const nextContent = nextItemWrapper.content || nextItemWrapper; // Handle nested structure

    if (!nextContent) return;

    // Transition to next item
    if (nextContent.type === 'series') {
      // Fetch seasons/episodes for the next series
      setIsLoadingEpisodes(true);
      try {
        // Re-use logic to fetch season with history
        const { data, error } = await supabase
          .from('seasons')
          .select('*, episodes(*, user_watch_history(*))')
          .eq('series_id', nextContent.id)
          .order('season_number', { ascending: true });

        if (data && data.length > 0) {
          const sortedSeasons = data.map((s: any) => ({
            ...s,
            episodes: s.episodes?.map((ep: any) => {
              const history = Array.isArray(ep.user_watch_history)
                ? ep.user_watch_history.find((h: any) => h.user_id === user?.id)
                : ep.user_watch_history;

              return {
                ...ep,
                watch_percentage: history?.watch_percentage || 0,
                last_position: history?.last_position || 0,
                completed: history?.completed || false,
                user_watch_history: undefined
              };
            }).sort((a: any, b: any) => a.episode_number - b.episode_number)
          }));

          const firstSeason = sortedSeasons[0];
          const firstEpisode = firstSeason?.episodes?.[0];

          if (firstSeason && firstEpisode) {
            dispatch(openScreenPlayer({
              isOpen: true,
              isSeries: true,
              selectedVideo: firstEpisode,
              currentVideoIndex: 0, // Start at beginning of new series
              seriesData: sortedSeasons,
              contentId: nextContent.id, // Set new series ID
              poster_url: nextContent.poster_url,
              // Keep playlist info!
              playlistInfo: contentIds
            }));
            setSeasons(sortedSeasons);
            setSelectedSeasonId(firstSeason.id);
          }
        }
      } catch (e) {
        console.error("Error fetching next series:", e);
      } finally {
        setIsLoadingEpisodes(false);
      }
    } else {
      // Next item is a movie
      dispatch(openScreenPlayer({
        isOpen: true,
        isSeries: false,
        selectedVideo: nextContent,
        contentId: nextContent.id,
        poster_url: nextContent.poster_url,
        // We don't track 'index' for playlist in the same way VideoPlayer tracks episodes, 
        // but VideoPlayer will see 'isSeries: false' and use playlistItems.
        // If isSeries=false, queue=playlistItems. So we must set index to currentIndex + 1.
        currentVideoIndex: currentIndex + 1,
        playlistInfo: contentIds
      }));
      setSeasons([]);
    }
  };

  // const MemoizedVideoPlayer = memo(VideoPlayer);
  useEffect(() => {
    moviesRef.current = movies;
    durationRef.current = duration;
    currentMovieIdRef.current = movies[0]?.id || null;

    // Only update currentMovie if the movies array actually changed structure
    // This prevents re-renders if only "duration" changes
    if (movies[0] && movies[0].id !== currentMovie?.id) {
      setCurrentMovie(movies[0]);
    }


  }, [movies])
  const [seasons, setSeasons] = useState<any[]>(season || []);

  useEffect(() => {
    if (season) {
      setSeasons(season);
    }
  }, [season, isSeries]);

  // Sync with Redux seriesData and poster_url
  useEffect(() => {
    if (isSeries && seriesDataFromRedux) {
      const seasonsToSet = Array.isArray(seriesDataFromRedux) ? seriesDataFromRedux : [seriesDataFromRedux];
      setSeasons(seasonsToSet);

      if (seasonsToSet.length > 0) {
        // Check if current selected season is actually in the new list, if not select the first one
        const seasonExists = seasonsToSet.find(s => s.id === selectedSeasonId);
        if (!seasonExists) {
          setSelectedSeasonId(seasonsToSet[0].id);
        }
      }
    }
  }, [seriesDataFromRedux, isSeries]);

  // Fetch seasons when switching to a different series via Related/Recommended
  useEffect(() => {
    const fetchNewSeasons = async () => {
      // Check if we switched to a series that matches selectedContent but differs from current seasons
      if (isSeries && currentSeriesId && (!seasons.length || seasons[0]?.series_id !== currentSeriesId)) {
        setIsLoadingEpisodes(true);
        try {
          const { data, error } = await supabase
            .from('seasons' as any)
            .select('*, episodes(*, user_watch_history(*))')
            .eq('series_id', currentSeriesId)
            .order('season_number', { ascending: true });

          if (data) {
            // Sort episodes and flatten history
            const sortedSeasons = data.map((s: any) => ({
              ...s,
              episodes: s.episodes?.map((ep: any) => {
                // Find history for this specific user if multiple returned (though RLS/filtering usually handles this)
                const history = Array.isArray(ep.user_watch_history)
                  ? ep.user_watch_history.find((h: any) => h.user_id === user?.id)
                  : ep.user_watch_history;

                return {
                  ...ep,
                  series_id: s.series_id || s.content_id, // Inject series_id
                  watch_percentage: history?.watch_percentage || 0,
                  last_position: history?.last_position || 0,
                  completed: history?.completed || false,
                  user_watch_history: undefined // Cleanup
                };
              }).sort((a: any, b: any) => a.episode_number - b.episode_number)
            }));
            setSeasons(sortedSeasons);

            // Find currently selected episode in the newly fetched seasons to get its history
            const currentId = selectedContent?.id;
            let enrichedEpisode = null;
            if (currentId) {
              for (const s of sortedSeasons) {
                const match = s.episodes?.find((ep: any) => ep.id === currentId);
                if (match) {
                  enrichedEpisode = match;
                  break;
                }
              }
            }

            if (sortedSeasons.length > 0) {
              dispatch(openScreenPlayer({
                isSeries: true,
                seriesData: sortedSeasons,
                selectedVideo: enrichedEpisode || selectedContent,
                contentId: currentSeriesId,
                poster_url: seriesPosterUrl || poster_url
              }));
            }

            // Always select first season when series changes if not already set
            if (sortedSeasons.length > 0) {
              const first = sortedSeasons[0];
              if (!selectedSeasonId || (enrichedEpisode && enrichedEpisode.season_id !== selectedSeasonId)) {
                setSelectedSeasonId(enrichedEpisode?.season_id || first.id);
              }
            }
          }
        } catch (error) {
          console.error("Error fetching seasons:", error);
        } finally {
          setIsLoadingEpisodes(false);
        }
      } else if (!isSeries && seasons.length > 0) {
        setSeasons([]);
        setSelectedSeasonId("");
      }
    };

    fetchNewSeasons();
  }, [selectedContent?.id, selectedContent?.type, isSeries]);


  useEffect(() => {
    if (seasons && seasons.length > 0 && !selectedSeasonId) {
      const firstSeason = seasons[0];
      const firstEpisode = firstSeason.episodes?.[0];
      if (firstSeason && firstEpisode) {
        setSelectedSeasonId(firstSeason.id);
        if (!currentEpisode || (currentEpisode as any).series_id !== firstSeason.series_id) {
          setCurrentEpisode(firstEpisode);
          setMovieid(firstEpisode.id);
          setActualVideoUrl(firstEpisode.video_url || firstEpisode.videoUrl);
          setMovies([firstEpisode]);
        }
      }
    }
  }, [type, seasons, selectedSeasonId, isSeries]);

  // Derived state: Get episodes for the currently selected season
  const currentSeasonEpisodes = seasons?.length > 0 && seasons?.find(s => s.id === selectedSeasonId)?.episodes || [];
  // console.log("Current Season Episodes", currentSeasonEpisodes)
  // Fetch movie data from Supabase
  useEffect(() => {
    async function fetchMovies() {
      // If it's a series and we already have the episode in 'movies' state, 
      // don't fetch from the "content" table (series episodes are usually in the "episodes" or "seasons" data)
      if (type === 'series') return;

      const queryUrl = actualVideoUrl || videoUrl;
      if (!queryUrl || typeof queryUrl === 'object') return;

      const { data, error } = await supabase
        .from(`content?select=*,user_watch_history(*,movie_id)&user_watch_history.user_id=eq.${user?.id}`)
        .select("*")
        .eq("video_url", queryUrl);

      if (!error && data) {
        setMovies(data);
      }
    }

    fetchMovies();
  }, [actualVideoUrl, type]); // Remove videoUrl from dependencies if actualVideoUrl is derived from it

  // Sync local state with Redux selectedContent (handles autoplay updates)
  useEffect(() => {
    if (selectedContent) {
      // Merge local progress if available
      const progress = localProgress[selectedContent.id];
      const updatedContent = progress ? {
        ...selectedContent,
        watch_percentage: progress.watch_percentage,
        last_position: progress.last_position
      } : selectedContent;

      if (type === 'series' || updatedContent.episode_number) {
        setCurrentEpisode(updatedContent);
        setMovieid(updatedContent.id);
        setActualVideoUrl(updatedContent.video_url || updatedContent.videoUrl);
        if (updatedContent.season_id && updatedContent.season_id !== selectedSeasonId) {
          setSelectedSeasonId(updatedContent.season_id);
        }
      } else {
        setMovieid(updatedContent.id);
        const url = updatedContent.video_url || updatedContent.videoUrl || reduxVideoUrl;
        setActualVideoUrl(url);
        // Ensure movies state reflects current content for related fetch etc
        if (updatedContent.id !== currentMovie?.id) {
          setMovies([updatedContent]);
        }
        // If switching to a movie, clear seasons
        if (seasons.length > 0) {
          setSeasons([]);
        }
      }
    } else if (reduxVideoUrl) {
      setActualVideoUrl(reduxVideoUrl);
    }
  }, [selectedContent, reduxVideoUrl, localProgress]);

  // Ad Timer
  useEffect(() => {
    // Start interval
    const interval = setInterval(() => {
      setShowAd(true);
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, []);

  // Ad Auto-dismiss
  useEffect(() => {
    if (showAd) {
      const timer = setTimeout(() => {
        setShowAd(false);
      }, 10000); // 10 seconds duration
      return () => clearTimeout(timer);
    }
  }, [showAd]);

  // Fetch related content
  // 1. OPTIMIZED FETCH (N+1 Fix)
  // Fetch related content with filters
  useEffect(() => {
    async function fetchRelatedContent() {
      if (!currentMovie?.id) return;

      const genre = selectedGenre !== "All" ? selectedGenre : undefined;
      const year = selectedYear !== "All" ? selectedYear : undefined;
      const type = selectedType !== "All" ? selectedType : undefined;

      const { data: relatedData } = await triggerRelatedContent({
        userId: user?.id,
        genre,
        year,
        type
      });

      if (!relatedData) return;

      const filtered = relatedData.filter((item: any) => item.id !== currentMovie.id);

      // Merge history (embedded)
      const merged = filtered.map((item: any) => {
        // Handle array or single object from Supabase join
        const history = Array.isArray(item.user_watch_history)
          ? item.user_watch_history[0]
          : item.user_watch_history;

        return {
          ...item,
          watch_percentage: history?.watch_percentage || 0,
          last_position: history?.last_position || 0,
          completed: history?.completed || false
        };
      });

      setRelatedContent(merged);
    }

    fetchRelatedContent();
  }, [selectedGenre, selectedYear, selectedType, currentMovie?.id, triggerRelatedContent]);


  console.log("Current Movie in FullscreenPlayer:", selectedContent);
  console.log("Related Content in FullscreenPlayer:", relatedContent);
  console.log("Movies in FullscreenPlayer:", movies);
  console.log("Actual Video URL in FullscreenPlayer:", actualVideoUrl);
  console.log("Video URL prop in FullscreenPlayer:", videoUrl);
  console.log("Seasons in FullscreenPlayer:", season);

  useEffect(() => {
    async function fetchRecommendations() {
      const recommend = await triggerRecommendations({ userId: user?.id });

      setRecommended(recommend?.data)
    }
    fetchRecommendations();
  }, [])



  console.log("Recommended Movies:", recommended);


  const handleSearch = async (query: string) => {
    if (query.trim().length === 0) return [];
    const searchResult = await triggerGetSearchContentWithWatchHistory({ userId: "03fa9a91-4281-4bd4-9e60-4da2ba72b0f3", search: query }).unwrap()
    // const { data, error } = await supabase
    //   .from("content")
    //   .select("*")
    //   .ilike("title", `%${query}%`)
    //   .order("created_at", { ascending: false });

    // if (error) {
    //   console.error("Error fetching search results:", error);
    //   return [];
    // }
    setIsSearching(false);
    setSearchResults(searchResult || []);
  };

  console.log("Search Results in FullscreenPlayer:", searchResults);
  const handleRelatedClick = (id: string) => {
    setVideoId(id);

    setTimeout(() => {
      playerRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  const genres = ["All", "Action", "Comedy", "Drama", "Thriller", "Romance", "Sci-Fi"];
  const years = ["All", "2024", "2023", "2022", "2021", "2020"];
  const types = ["All", "movie", "series"];

  if (!isOpen) return null;

  return (
    <ProtectedRoute>
      <div className="fixed inset-0 z-[9999] overflow-y-hidden overflow-x-hidden" style={{
        background: `linear-gradient(200deg, #311066 0%, #1D0833 20%, #120222 45%, black 100%)`,
      }}>


        <div className="w-full mx-auto p-2 sm:p-8 h-full overflow-y-auto">
          <div className="max-w-7xl mx-auto px-0 sm:px-4 py-6 sm:py-12">
            <div className="flex justify-center items-center gap-4 mb-4">
              <div className="flex items-center justify-start gap-4 cursor-pointer flex-1" onClick={async () => {
                console.log("🔙 [FullscreenPlayer] Back button clicked, saving and refetching...");
                // Ensure we save progress to the DB before fetching fresh data
                if (parentRef.current && (parentRef.current as any).saveProgress) {
                  await (parentRef.current as any).saveProgress();
                }

                // Trigger direct refetch
                refetchContentWithWatchHistory();

                // Close immediately
                onClose();
                dispatch(closeScreenPlayer());
              }}>
                <svg className="w-6 h-6" fill="none" stroke="white" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <p className="text-lg font-semibold text-white ">Back</p>
              </div>
              {/* <SearchBar
              onSearch={handleSearch}
              onResultSelect={setActualVideoUrl}
              results={searchResults}
              isLoading={isSearching}
              placeholder="Search to add movies..."
              className="flex-[14] z-50"
              setActualVideoUrl={setActualVideoUrl}
              setMovieid={setMovieid}
            /> */}
            </div>

            <div className="flex items-center mx-auto justify-center aspect-[4/3] sm:aspect-video w-full bg-black rounded-lg sm:rounded-2xl overflow-hidden mb-8 relative shadow-2xl border border-white/10">
              {/* <div ref={playerContainerRef} className="w-full h-full" /> */}
              <div ref={playerRef} className="flex items-center justify-center h-full w-full sm:min-w-full md:sm:min-w-full">
                {
                  actualVideoUrl && (
                    (playlistId || contentIds) ? (
                      <PlaylistVideoPlayer
                        videoId={selectedContent?.video_url || selectedContent?.videoUrl || actualVideoUrl}
                        setCurrentMovie={setCurrentMovie}
                        type={type}
                        setFinal={setFinal}
                        setActualVideoUrl={setActualVideoUrl}
                        playlistItems={playlists}
                        movieId={selectedContent?.id || movieId}
                        episodeId={seasons?.length > 0 ? (selectedContent?.id || movieId) : undefined}
                        userid={user?.id}
                        playlistInfo={playlistInfo}
                        ref={parentRef}
                        onProgressUpdate={handleProgressUpdate}
                        localProgress={localProgress}
                        onPlaylistAdvance={handlePlaylistAdvance}
                        playlistId={playlistId}
                        completionThreshold={selectedContent?.completion_threshold_seconds || currentEpisode?.completion_threshold_seconds || currentMovie?.completion_threshold_seconds}
                      />
                    ) : (
                      <VideoPlayer
                        key={(selectedContent?.id || movieId) || (actualVideoUrl || reduxVideoUrl)}
                        videoId={selectedContent?.video_url || selectedContent?.videoUrl || actualVideoUrl}
                        setCurrentMovie={setCurrentMovie}
                        type={type}
                        setFinal={setFinal}
                        setActualVideoUrl={setActualVideoUrl}
                        playlistItems={playlists}
                        movieId={selectedContent?.id || movieId}
                        episodeId={seasons?.length > 0 ? (selectedContent?.id || movieId) : undefined}
                        userid={user?.id}
                        playlistInfo={playlistInfo}
                        ref={parentRef}
                        onProgressUpdate={handleProgressUpdate}
                        localProgress={localProgress}
                        onPlaylistAdvance={handlePlaylistAdvance}
                        completionThreshold={selectedContent?.completion_threshold_seconds || currentEpisode?.completion_threshold_seconds || currentMovie?.completion_threshold_seconds || selectedContent?.content?.completion_threshold_seconds}
                      />
                    )
                  )
                }
              </div>
            </div>
            {isSeries && (
              <div className="mb-8">
                {isLoadingEpisodes ? (
                  <div className="space-y-8 animate-pulse">
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3].map(i => <div key={i} className="h-10 w-24 bg-white/5 rounded-lg" />)}
                    </div>
                    <div className="h-8 w-32 bg-white/5 rounded mb-6" />
                    <div className="flex gap-4 overflow-hidden">
                      {[1, 2, 3].map(i => <div key={i} className="flex-shrink-0 w-80 aspect-video bg-white/5 rounded-lg" />)}
                    </div>
                  </div>
                ) : seasons?.length > 0 ? (
                  <>
                    <div className="flex flex-col items-center mb-8">
                      {/* Centered Season Tabs */}
                      <div className="flex flex-wrap justify-center gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
                        {seasons.map((season) => {
                          const isActive = selectedSeasonId === season.id;
                          return (
                            <button
                              key={season.id}
                              onClick={() => setSelectedSeasonId(season.id)}
                              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                : 'text-white/60 hover:text-white hover:bg-white/10'
                                }`}
                            >
                              {season.title || `Season ${season.season_number}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <h2 className="text-white text-2xl font-bold mb-6">Episodes</h2>
                      {/* Episode Grid/List */}
                      <ScrollArea className="w-full pb-4">
                        <div className="flex w-max gap-4 pb-4">
                          {currentSeasonEpisodes.map((episode: any, index) => (
                            <div
                              key={episode.id}
                              className={`flex-shrink-0 w-80 cursor-pointer group snap-start transition-all duration-300 ${currentEpisode?.id === episode.id
                                ? 'ring-2 ring-blue-500'
                                : 'hover:ring-2 hover:ring-white/30'
                                }`}
                              onClick={() => {
                                // Merge local progress if available to ensure player resumes correctly
                                const progress = localProgress[episode.id];
                                const updatedEpisode = progress ? {
                                  ...episode,
                                  watch_percentage: progress.watch_percentage,
                                  last_position: progress.last_position
                                } : episode;

                                const isSameEpisode = currentEpisode?.id === episode.id;

                                setCurrentEpisode(updatedEpisode);
                                setActualVideoUrl(updatedEpisode.video_url || updatedEpisode.videoUrl);
                                setVideoEnded(false);
                                setMovieid(updatedEpisode?.id)
                                setMovies([updatedEpisode])
                                playerRef.current?.scrollIntoView({ behavior: "smooth" });

                                // If user clicks the SAME episode that's currently loaded (e.g. to replay it), 
                                // force a replay via the ref since props won't trigger a reload.
                                if (isSameEpisode && parentRef.current && (parentRef.current as any).replay) {
                                  console.log("Replaying current episode...");
                                  (parentRef.current as any).replay();
                                }

                                // Calculate global index for seamless playback across all seasons
                                const currentSeasonIndex = seasons.findIndex(s => s.id === selectedSeasonId);
                                const episodesBefore = seasons.slice(0, currentSeasonIndex).reduce((sum, s) => sum + (s.episodes?.length || 0), 0);
                                const globalIndex = episodesBefore + index;

                                dispatch(openScreenPlayer({
                                  isOpen: true,
                                  selectedVideo: updatedEpisode,
                                  currentVideoIndex: globalIndex,
                                  isSeries: true,
                                  seriesData: seasons,
                                  poster_url: seriesPosterUrl || poster_url,
                                  contentId: seriesContentId || movieId || updatedEpisode.series_id
                                }))
                              }}
                            >
                              <div className="bg-white/5 rounded-lg overflow-hidden">
                                <div className="relative aspect-video bg-slate-900">
                                  <img
                                    src={getOptimizedImageUrl(episode.poster_url || seriesPosterUrl || poster_url, 400)}
                                    alt={episode.title}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                  />
                                  {currentEpisode?.id === episode.id && (
                                    <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                                      <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-lg">
                                        Now Playing
                                      </div>
                                    </div>
                                  )}
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                    <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                    </svg>
                                  </div>

                                  {/* Progress Bar with Live Update */}
                                  {(localProgress[episode.id]?.watch_percentage > 0 || episode.watch_percentage > 0) && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                                      <div
                                        className="h-full bg-blue-500 transition-all duration-300"
                                        style={{ width: `${localProgress[episode.id]?.watch_percentage || episode.watch_percentage}%` }}
                                      />
                                    </div>
                                  )}
                                </div>

                                <div className="p-4">
                                  <div className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
                                    Episode {episode.episode_number}
                                  </div>
                                  <h3 className="text-white font-semibold mb-2 line-clamp-1">
                                    {episode.title}
                                  </h3>
                                  {episode.description && (
                                    <p className="text-white/60 text-sm line-clamp-2">
                                      {episode.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>
                    </div>
                  </>
                ) : null}
              </div>
            )}

            {/* Movie Details Section */}
            <MovieDetailSection />

            {/* Filters Section */}
            <div className="mb-8">
              {/* // In your Parent Page/Component */}
              <RecommendedSection
                // recommended={recommended} // The object { genre_based: [...], popular: [...] }
                handleRelatedClick={handleRelatedClick}
                setMovieid={setMovieid}
                setActualVideoUrl={setActualVideoUrl}
                setMovies={setMovies}
                setVideoEnded={setVideoEnded}
                setPlaylists={setPlaylists}
                getOptimizedImageUrl={getOptimizedImageUrl}
              />

            </div>


            {/* Related Content Grid */}
            {/* <RelatedContent
            handleRelatedClick={handleRelatedClick}
            setMovieid={setMovieid}
            setActualVideoUrl={setActualVideoUrl}
            setMovies={setMovies}
            setVideoEnded={setVideoEnded}
            setPlaylists={setPlaylists}
            relatedContent={relatedContent}
            isLoading={resultRelatedContent.isFetching}
          /> */}
          </div>
        </div>
        <AdToast isVisible={showAd} onClose={() => setShowAd(false)} />
      </div >
    </ProtectedRoute>
  );
};

export default FullscreenPlayer;
