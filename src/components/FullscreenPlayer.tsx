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
import { openScreenPlayer } from "@/store/screenPlayerSlice";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";

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
  onHistorySaved
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
  // Refs to hold latest values for callbacks to avoid dependency cycles
  const moviesRef = useRef(movies);
  const durationRef = useRef(duration);
  const currentMovieIdRef = useRef<string | null>(null);
  const playlistRef = useRef<string>("")
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
  const [triggerGetContentWithWatchHistory, result] = useLazyGetPlaylistContentWithWatchHistoryQuery()
  const isSeries = useSelector((state: any) => state.screenPlayer.isSeries);
  const contentIds = useSelector((state: any) => state.screenPlayer.playlistInfo);
  const playlistId = useSelector((state: any) => state.screenPlayer.playlistId)
  const {user} = useAuth()

  const [triggerGetSearchContentWithWatchHistory, resultGetSearchContentWithWatchHistory] = useLazyGetSearchContentWithWatchHistoryQuery()
  console.log("Selected Content from Redux in FullscreenPlayer:", currentEpisode?.id);
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
  useEffect(() => {
    if (season && season.length > 0 && !selectedSeasonId) {
      const firstSeason = season[0];
      const firstEpisode = firstSeason.episodes?.[0];
      if (firstEpisode) {
        setSelectedSeasonId(firstSeason.id);
        setCurrentEpisode(firstEpisode); // Set the full object
        setMovieid(firstEpisode.id);
        setActualVideoUrl(firstEpisode.video_url || firstEpisode.videoUrl);
        setMovies([firstEpisode]);
      }
    }
  }, [type, season]);
  console.log("current Episode:", currentEpisode);



  // Derived state: Get episodes for the currently selected season
  const currentSeasonEpisodes = season?.length > 0 && season?.find(s => s.id === selectedSeasonId)?.episodes || [];
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
      if (type === 'series' || selectedContent.episode_number) {
        setCurrentEpisode(selectedContent);
        setMovieid(selectedContent.id);
        setActualVideoUrl(selectedContent.video_url || selectedContent.videoUrl);
        if (selectedContent.season_id && selectedContent.season_id !== selectedSeasonId) {
          setSelectedSeasonId(selectedContent.season_id);
        }
      } else {
        setMovieid(selectedContent.id);
        setActualVideoUrl(selectedContent.video_url);
        // Ensure movies state reflects current content for related fetch etc
        if (selectedContent.id !== currentMovie?.id) {
          setMovies([selectedContent]);
        }
      }
    }
  }, [selectedContent]);

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



  useEffect(() => {
    async function fetchRecommendations() {
      const recommend = await triggerRecommendations({ userId: user?.id });

      setRecommended(recommend?.data)
    }
    fetchRecommendations();
  }, [])





  const handleSearch = async (query: string) => {
    if (query.trim().length === 0) return [];
    const searchResult = await triggerGetSearchContentWithWatchHistory({ userId: user?.id, search: query }).unwrap()
    setIsSearching(false);
    setSearchResults(searchResult || []);
  };

  const handleRelatedClick = (id: string, item) => {
    dispatch(openScreenPlayer({
      selectedVideo: item,
      isSeries: item.type === 'series',
    }))
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
            <div className="flex items-center justify-center gap-4 cursor-pointer flex-1" onClick={async () => {
              // setSelectedVideo(null)
              onClose()
              // navigate(`/playlist/${playlistId}`)
            }}>
              <svg className="w-6 h-6" fill="none" stroke="white" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <p className="text-lg font-semibold text-white">Back</p>
            </div>
            <SearchBar
              onSearch={handleSearch}
              onResultSelect={setActualVideoUrl}
              results={searchResults}
              isLoading={isSearching}
              placeholder="Search to add movies..."
              className="flex-[14] z-50"
              setActualVideoUrl={setActualVideoUrl}
              setMovieid={setMovieid}
            />
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
                  movieId={movieId}
                  episodeId={isSeries ? selectedContent?.id : undefined}
                  userid={user?.id}
                  playlistInfo={playlistInfo}
                  onHistorySaved={onHistorySaved}
                  ref={parentRef}
                />
              }


            </div>
            {/* Overlays */}
          </div>

          {season?.length > 0 && isSeries && (
            <div className="mb-8">
              <div className="flex flex-col items-center mb-8">


                {/* Centered Season Tabs */}
                <div className="flex flex-wrap justify-center gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
                  {season.map((season) => {
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
                  season && (
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
                                setCurrentEpisode(episode);
                                setActualVideoUrl(episode.video_url || episode.videoUrl);
                                setVideoEnded(false);
                                setMovieid(episode?.id)
                                setMovies([episode])
                                playerRef.current?.scrollIntoView({ behavior: "smooth" });
                                // Get all episodes from the current season for autoplay
                                const allEpisodes = currentSeasonEpisodes || [];
                                dispatch(openScreenPlayer({
                                  isOpen: true,
                                  selectedVideo: episode,
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

                                  {/* Progress Bar */}
                                  {episode.watch_percentage > 0 && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                                      <div
                                        className="h-full bg-blue-500 transition-all duration-300"
                                        style={{ width: `${episode.watch_percentage}%` }}
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
          <MovieDetailSection />

          {/* Filters Section */}
          <div className="mb-8">
            // In your Parent Page/Component
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