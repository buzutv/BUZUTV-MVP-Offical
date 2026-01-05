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
import { useLazyGetContentWithWatchHistoryFiltersQuery, useLazyGetPlaylistContentWithWatchHistoryQuery } from "@/store/contentSlice";
import RelatedContent from "./RelatedContent";
import { useSelector } from "react-redux";

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
  // Refs to hold latest values for callbacks to avoid dependency cycles
  const moviesRef = useRef(movies);
  const durationRef = useRef(duration);
  const currentMovieIdRef = useRef<string | null>(null);
  const playlistRef = useRef<string>("")
  // Episode selection state for series
  const [episodes, setEpisodes] = useState<Episode[]>([]);
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
  // const navigate = useNavigate();
  const [triggerRecommendations, resultRecommendations ] = useLazyGetRecommendationsWtihContentEmbeddedQuery();
  const [triggerRelatedContent, resultRelatedContent ] = useLazyGetContentWithWatchHistoryFiltersQuery();
  const selectedContent = useSelector((state:any) => state.screenPlayer.selectedVideo);
   const [triggerGetContentWithWatchHistory,result] = useLazyGetPlaylistContentWithWatchHistoryQuery()
   const contentIds = useSelector((state:any) => state.screenPlayer.playlistInfo);
   const playlistid  = useSelector((state:any) => state.screenPlayer.playlistId)

  console.log("Selected Content from Redux in FullscreenPlayer:", selectedContent);
  // const MemoizedVideoPlayer = memo(VideoPlayer);
  useEffect(() => {
    moviesRef.current = movies;
    durationRef.current = duration;
    currentMovieIdRef.current = movies[0]?.id || null;
    
    // Only update currentMovie if the movies array actually changed structure
    // This prevents re-renders if only "duration" changes
    if(movies[0] && movies[0].id !== currentMovie?.id) {
        setCurrentMovie(movies[0]);
    }

 
  }, [movies])
  useEffect(() => {
  if (type === 'series' && season && season.length > 0 && !selectedSeasonId) {
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
const currentSeasonEpisodes  = season?.length > 0  && season?.find(s => s.id === selectedSeasonId)?.episodes || [];
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

  // Fetch related content
// 1. OPTIMIZED FETCH (N+1 Fix)
// useEffect(() => {
//   async function fetchRelatedContent() {
//     if (!currentMovie?.id) return;
//     const found = await triggerRelatedContent({ userId: "03fa9a91-4281-4bd4-9e60-4da2ba72b0f3", genre: null, year: '2012', type: null });
//     console.log("Related Content found",found)
//     // Build the query
//     let query = supabase
//       .from("content")
//       .select("id, title, poster_url, year, genre, type") // Only select what you need
//       .neq("id", currentMovie.id)
//       .limit(12);

//     if (selectedGenre !== "All") query = query.eq("genre", selectedGenre);
//     if (selectedYear !== "All") query = query.eq("year", parseInt(selectedYear));
//     if (selectedType !== "All") query = query.eq("type", selectedType);

//     const { data: relatedData } = await query;
//     if (!relatedData) return;

//     // BATCH CALL: Get all history for these 12 items at once
//     const contentIds = relatedData.map(item => item.id);
//     const { data: historyData } = await supabase
//       .from("user_watch_history")
//       .select("id, movie_id, watch_percentage, last_position, completed")
//       .eq("user_id", "03fa9a91-4281-4bd4-9e60-4da2ba72b0f3")
//       .in("movie_id", contentIds);

//     // Merge history back into the related content locally
//     const merged = relatedData.map(item => {
//       const h = historyData?.find(hist => hist.movie_id === item.id);
//       return {
//         ...item,
//         watch_percentage: h?.watch_percentage || 0,
//         last_position: h?.last_position || 0,
//         completed: h?.completed || false
//       };
//     });

//     setRelatedContent(merged);
//   }

//   fetchRelatedContent();
// }, [selectedGenre, selectedYear, selectedType, currentMovie?.id]);


console.log("Current Movie in FullscreenPlayer:", currentMovie);
console.log("Related Content in FullscreenPlayer:", relatedContent);
console.log("Movies in FullscreenPlayer:", movies);
console.log("Actual Video URL in FullscreenPlayer:", actualVideoUrl);
console.log("Video URL prop in FullscreenPlayer:", videoUrl);
console.log("Seasons in FullscreenPlayer:", season);

  useEffect(() =>{
      async function fetchRecommendations() {
      const recommend = await triggerRecommendations({userId:"03fa9a91-4281-4bd4-9e60-4da2ba72b0f3"});

      setRecommended(recommend?.data)
      }
      fetchRecommendations();
  },[])



  console.log("Recommended Movies:", recommended);
  

  const handleSearch = async (query: string) => {
    if (query.trim().length === 0) return [];

    const { data, error } = await supabase
      .from("content")
      .select("*")
      .ilike("title", `%${query}%`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching search results:", error);
      return [];
    }
    setIsSearching(false);
    setSearchResults(data || []);
  };
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
    <div className="fixed inset-0 z-[9999] bg-[#0a0a0a] overflow-y-auto">

      <div className="min-w-[1280px] mx-auto w-full p-8" style={{
        background: `
            linear-gradient(
              200deg,
              #311066 0%,
              #1D0833 20%,
              #120222 45%,
              black 100%
            )`,
      }}  >

        <div className="w-full x-auto px-4 py-12">
          <div className="flex justify-center items-center gap-4 mb-4">
            <div className="flex items-center justify-center gap-4 cursor-pointer flex-1" onClick={async () => {
              setSelectedVideo(null)
              onClose()
              // navigate(`/playlists/${playlistid}`)
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
              className="mb-4 flex-3 z-50"
              setActualVideoUrl={setActualVideoUrl}
              setMovieid={setMovieid}
            />
          </div>

          <div className="aspect-video w-full bg-black rounded-lg overflow-hidden mb-8 relative">
            {/* <div ref={playerContainerRef} className="w-full h-full" /> */}
            <div ref={playerRef} className="h-[90%] w-full">
              {
                actualVideoUrl && 
                  <VideoPlayer
                    videoId={selectedContent?.video_url}
                    // last_position={lastPausedTime}
                    setCurrentMovie={setCurrentMovie}
                    type={type}
                    setFinal={setFinal}
                    setActualVideoUrl={setActualVideoUrl}
                    playlistItems={playlists}
                    movieId={selectedContent?.id}
                    episodeId={currentEpisode?.id} 
                    userid="03fa9a91-4281-4bd4-9e60-4da2ba72b0f3"
                    playlistInfo={playlistInfo}
                    ref={parentRef}
                  />
              }


            </div>
            {/* Overlays */}
          </div>
 
                {season?.length > 0 && (
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
                          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            isActive 
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
                <h2 className="text-white text-2xl font-bold mb-6">Episodes</h2>
                {/* Episode Grid/List */}
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                  {currentSeasonEpisodes.map((episode: any) => (
                    <div
                      key={episode.id}
                      className={`flex-shrink-0 w-80 cursor-pointer group snap-start transition-all duration-300 ${
                        currentEpisode?.id === episode.id
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
            <div className="flex flex-wrap gap-4">

              <div>
                <label className="text-white/60 text-sm mb-2 block bg-white/10 rounded-lg px-4 py-2">Genre</label>
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  aria-placeholder="Select Genre"
                  
                  className="text-white px-4 py-2 bg-white/10 rounded-lg border border-white/20 focus:border-white/40 outline-none"
                >
                  {genres.map(genre => (
                    <option key={genre} value={genre} className="bg-[#1a1a1a]">{genre}</option>
                  ))}
                </select>
              </div>

              {/* Year Filter */}
              <div>
                <label className="text-white/60 text-sm mb-2 block bg-white/10 rounded-lg px-4 py-2">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-white/10 text-white px-4 py-2 rounded-lg border border-white/20 focus:border-white/40 outline-none"
                >
                  {years.map(year => (
                    <option key={year} value={year} className="bg-[#1a1a1a]">{year}</option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="text-white/60 text-sm mb-2 block bg-white/10 rounded-lg px-4 py-2">Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="bg-white/10 text-white px-4 py-2 rounded-lg border border-white/20 focus:border-white/40 outline-none"
                >
                  {types.map(type => (
                    <option key={type} value={type} className="bg-[#1a1a1a] capitalize">{type}</option>
                  ))}
                </select>
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
            // relatedContent={relatedContent}
          />
        </div>
      </div>
    </div>
  );
};

export default FullscreenPlayer;