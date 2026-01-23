import { fetchSeriesSeasons, fetchWatchHistory, getOptimizedImageUrl, getRecommendedMovies, getYouTubeEmbedUrl, saveWatchHistory } from "@/utils/youtubeUtils";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import SearchBar from "./SearchBar";
import VideoPlayer from "./VideoPlayer";
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
  playlistInfo
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
  const playlistId = useSelector((state: any) => state.screenPlayer.playlistId)
  const [triggerGetSearchContentWithWatchHistory, resultGetSearchContentWithWatchHistory] = useLazyGetSearchContentWithWatchHistoryQuery()
  console.log("Selected Content from Redux in FullscreenPlayer:", currentEpisode?.id);
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
  }, [season]);

  // Fetch seasons when switching to a different series via Related/Recommended
  useEffect(() => {
    const fetchNewSeasons = async () => {
      // Check if we switched to a series that matches selectedContent but differs from current seasons
      if (selectedContent?.type === 'series' && selectedContent.id && (!seasons.length || seasons[0]?.series_id !== selectedContent.id)) {
        const { data, error } = await supabase
          .from('seasons')
          .select('*, episodes(*)')
          .eq('series_id', selectedContent.id)
          .order('season_number', { ascending: true });

        if (data) {
          // Sort episodes by episode_number
          const sortedSeasons = data.map(s => ({
            ...s,
            episodes: s.episodes?.sort((a: any, b: any) => a.episode_number - b.episode_number)
          }));
          setSeasons(sortedSeasons);

          // Auto-select first season/episode if not already playing
          if (sortedSeasons.length > 0 && !selectedSeasonId) {
            const first = sortedSeasons[0];
            setSelectedSeasonId(first.id);
          }
        }
      }
    };

    fetchNewSeasons();
  }, [selectedContent?.id, selectedContent?.type]);


  useEffect(() => {
    if (seasons && seasons.length > 0 && !selectedSeasonId) {
      const firstSeason = seasons[0];
      const firstEpisode = firstSeason.episodes?.[0];
      if (firstEpisode) {
        setSelectedSeasonId(firstSeason.id);
        if (!currentEpisode || currentEpisode.series_id !== firstSeason.series_id) {
          setCurrentEpisode(firstEpisode);
          setMovieid(firstEpisode.id);
          setActualVideoUrl(firstEpisode.video_url || firstEpisode.videoUrl);
          setMovies([firstEpisode]);
        }
      }
    }
  }, [type, seasons, selectedSeasonId]);

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
        .from("content")
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


  console.log("Current Movie in FullscreenPlayer:", currentMovie);
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
    <div className="fixed inset-0 z-[9999] overflow-y-auto" style={{
      background: `linear-gradient(200deg, #311066 0%, #1D0833 20%, #120222 45%, black 100%)`,
    }}>

      <div className="max-w-[1600px] mx-auto w-full p-8">
        <div className="w-full x-auto px-4 py-12">
          <div className="flex justify-center items-center gap-4 mb-4">
            <div className="flex items-center justify-start gap-4 cursor-pointer flex-1" onClick={async () => {
              // // Save progress first
              // if (parentRef.current && (parentRef.current as any).saveProgress) {
              //   await (parentRef.current as any).saveProgress();
              // }
              // Then refetch content to get updated history
              await refetchContentWithWatchHistory()

              // Finally close
              onClose()
              dispatch(closeScreenPlayer())
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

          <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden mb-8 relative shadow-2xl border border-white/10">
            {/* <div ref={playerContainerRef} className="w-full h-full" /> */}
            <div ref={playerRef} className="h-full w-full">
              {
                actualVideoUrl &&
                <VideoPlayer
                  key={selectedContent?.id || selectedContent?.video_url}
                  videoId={selectedContent?.video_url}
                  // last_position={lastPausedTime}
                  setCurrentMovie={setCurrentMovie}
                  type={type}
                  setFinal={setFinal}
                  setActualVideoUrl={setActualVideoUrl}
                  playlistItems={playlists}
                  movieId={selectedContent?.id}
                  episodeId={seasons?.length > 0 ? selectedContent?.id : undefined}
                  userid={user?.id}
                  playlistInfo={playlistInfo}
                  ref={parentRef}
                  onProgressUpdate={handleProgressUpdate}
                />
              }


            </div>
            {/* Overlays */}
          </div>

          {seasons?.length > 0 && (
            <div className="mb-8">
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
                {
                  seasons && (
                    <>
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

                                setCurrentEpisode(updatedEpisode);
                                setActualVideoUrl(updatedEpisode.video_url || updatedEpisode.videoUrl);
                                setVideoEnded(false);
                                setMovieid(updatedEpisode?.id)
                                setMovies([updatedEpisode])
                                playerRef.current?.scrollIntoView({ behavior: "smooth" });

                                // Get all episodes from the current season for autoplay
                                const allEpisodes = currentSeasonEpisodes || [];
                                dispatch(openScreenPlayer({
                                  isOpen: true,
                                  selectedVideo: updatedEpisode,
                                  currentVideoIndex: index,
                                  isSeries: true,
                                  seriesData: { episodes: allEpisodes }
                                }))
                              }}
                            >
                              <div className="bg-white/5 rounded-lg overflow-hidden">
                                <div className="relative aspect-video bg-slate-900">
                                  <img
                                    src={poster_url}
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


                    </>

                  )
                }


              </div>
            </div>
          )}

          {/* Movie Details Section */}
          <MovieDetailSection content={selectedContent?.id} />

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

            <h2 className="text-white text-2xl font-bold mb-4">More Like This</h2>
            <div className="flex flex-col gap-8 w-full">
              {/* Genre Filter - Interactive Pills */}
              <div className="flex flex-col gap-4">
                <label className="text-white/60 text-sm font-semibold ml-1 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                  Genre
                </label>
                <ScrollArea className="w-full pb-4">
                  <div className="flex w-max gap-3">
                    {genres.map(genre => (
                      <button
                        key={genre}
                        onClick={() => setSelectedGenre(genre)}
                        className={`px-6 py-3 rounded-full text-base font-medium transition-all duration-300 transform border hover:scale-105 active:scale-95 ${selectedGenre === genre
                          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.3)]'
                          : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border-white/5 hover:border-white/20'
                          }`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" className="hidden" />
                </ScrollArea>
              </div>

              {/* Type Pills & Year Selector Row */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-end">
                {/* Type Filter - Pills */}
                <div className="flex flex-col gap-4">
                  <label className="text-white/60 text-sm font-semibold ml-1 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                    Type
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {types.map(type => (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`px-8 py-3 rounded-full text-base font-medium transition-all duration-300 transform border hover:scale-105 active:scale-95 capitalize ${selectedType === type
                          ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white border-purple-400 shadow-[0_0_20px_rgba(147,51,234,0.3)]'
                          : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border-white/5 hover:border-white/20'
                          }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Year Filter - Selector */}
                <div className="flex flex-col gap-4 min-w-[240px]">
                  <label className="text-white/60 text-sm font-semibold ml-1 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
                    Year
                  </label>
                  <div className="relative group">
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full appearance-none bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-full border border-white/10 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all cursor-pointer text-base font-medium shadow-lg"
                    >
                      {years.map(year => (
                        <option key={year} value={year} className="bg-[#1a1a1a]">{year}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50 group-hover:text-white transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Related Content Grid */}
          <RelatedContent
            handleRelatedClick={handleRelatedClick}
            setMovieid={setMovieid}
            setActualVideoUrl={setActualVideoUrl}
            setMovies={setMovies}
            setVideoEnded={setVideoEnded}
            setPlaylists={setPlaylists}
            relatedContent={relatedContent}
            isLoading={resultRelatedContent.isFetching}
          />
        </div>
      </div>
      <AdToast isVisible={showAd} onClose={() => setShowAd(false)} />
    </div>
  );
};

export default FullscreenPlayer;