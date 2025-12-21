import { fetchSeriesSeasons, fetchWatchHistory, getOptimizedImageUrl, getRecommendedMovies, getYouTubeEmbedUrl, saveWatchHistory } from "@/utils/youtubeUtils";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import SearchBar from "./SearchBar";
import VideoPlayer from "./VideoPlayer";
import usePlaylists from "@/hooks/usePlaylists";
// import {memo} from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import RecommendedSection from "./RecommendedSection";

// Episode interface
interface Episode {
  title: string;
  description: string;
  episodeNumber: number;
  videoUrl: string;
  poster_url?: string;
  airDate?: string;
  rating?: string;
  seasonNumber?: number;
}

interface FullscreenPlayerProps {
  isOpen: boolean;
  onClose?: () => void;
  videoUrl: string | any; // Can be a string for movies or object for series
  title: string;
  userId: string;
  // Playlist props
  type: string;
  onVideoEnd?: () => void;
  setSelectedVideo?: (video: any) => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  // video?: any;
  movieId: string;
  playlistInfo?: {
    current: number;
    setIndex: (index: number) => void;
    total: number;
    autoPlay: boolean;
    totalMovies: number;
  };
}

const FullscreenPlayer = ({
  isOpen,
  onClose,
  videoUrl,
  title,
  userId,
  type,
  setSelectedVideo,
  onVideoEnd,
  movieId,
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
  const [actualVideoUrl, setActualVideoUrl] = useState("");
  const id = useParams()
  const { fetchSinglePlaylist } = usePlaylists()
  const [playlists, setPlaylists] = useState<any[]>([])
  const { refetch } = usePlaylists()
  const [recommended, setRecommended] = useState<any[]>([])
  const [seasons, setSeasons] = useState<any[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  // Sync refs with state
  const parentRef = useRef()


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

  console.log("parentRef", currentMovie)
  // console.log("final in fullscreeplayer", video)
  useEffect(() => {
    if (id) {
      async function fetchData() {
        const scopedData = await fetchSinglePlaylist(id.id)
        setPlaylists(scopedData)
        playlistRef.current = id.id
      }
      fetchData()
    }
  }, [id])

  // Parse seasons_data for series content


useEffect(() => {
  async function parseSeasonsData() {
    if (typeof videoUrl === 'object' && videoUrl?.type === 'series') {
      try {
        // Fetch all seasons for this content
        const seasonsData = await fetchSeriesSeasons(videoUrl.id);
        setSeasons(seasonsData);

        if (seasonsData.length > 0) {
          // Default to first season and its first episode
          const firstSeason = seasonsData[0];
          setSelectedSeasonId(firstSeason.id);
          
          if (firstSeason.episodes?.length > 0) {
            const firstEpisode = firstSeason.episodes[0];
            setCurrentEpisode(firstEpisode);
            setActualVideoUrl(firstEpisode.video_url || firstEpisode.videoUrl);
          }
        }
      } catch (error) {
        console.error('Error fetching series data:', error);
      }
    } else if (typeof videoUrl === 'string') {
      setSeasons([]);
      setActualVideoUrl(videoUrl);
    }
  }
  parseSeasonsData();
}, [videoUrl]);



// Derived state: Get episodes for the currently selected season
const currentSeasonEpisodes = seasons.find(s => s.id === selectedSeasonId)?.episodes || [];
console.log("Current Season Episodes", currentSeasonEpisodes)
  // Fetch movie data from Supabase
  useEffect(() => {
    async function fetchMovies() {
            // For series, query by ID instead of video_url
      // if (typeof videoUrl === 'object' && videoUrl?.id) {
      //   const { data, error } = await supabase
      //     .from("content")
      //     .select("*")
      //     .eq("id", videoUrl.id);

      //   // const {data:seasonsData} = await supabase
      //   // .from("seasons")
      //   // .select("*")
      //   // .eq("content_uuid", videoUrl.id)


      //   // console.log("Seasons Data", seasonsData)
      //   if (error) {
      //     console.error("Error fetching movies:", error);
      //   } else {
      //     setMovies(data || []);
      //   }
      //   return;
      // }

      // For regular movies, use actualVideoUrl
      const queryUrl = actualVideoUrl || videoUrl;
      const { data, error } = await supabase
        .from("content")
        .select("*")
        .eq("video_url", queryUrl);

      if (error) {
        console.error("Error fetching movies:", error);
      } else {
        setMovies(data || []);
      }
    }

    if (actualVideoUrl) {
      fetchMovies();
      setDuration(0);
    }
  }, [actualVideoUrl, videoUrl]);

  // Fetch related content
  useEffect(() => {
    async function fetchRelatedContent() {
      if (!currentMovie) return;

      let query = supabase
        .from("content")
        .select("*")
        .neq("id", currentMovie.id)
        .limit(12);

      if (selectedGenre !== "All") query = query.eq("genre", selectedGenre);
      if (selectedYear !== "All") query = query.eq("year", parseInt(selectedYear));
      if (selectedType !== "All") query = query.eq("type", selectedType);

      const { data, error } = await query;
      if (error || !data) return;

      // Fetch watch history for all items in parallel
      const dataWithHistory = await Promise.all(
        data.map(async (item) => {
          const history = await fetchWatchHistory(
            "03fa9a91-4281-4bd4-9e60-4da2ba72b0f3",
            item?.id
          );

          return {
            ...item,
            watch_percentage: history.watch_percentage,
            last_position: history.last_position,
            completed: history.completed
          };
        })
      );

      setRelatedContent(dataWithHistory);

      const recommend = await getRecommendedMovies("03fa9a91-4281-4bd4-9e60-4da2ba72b0f3");
   
      setRecommended(recommend)
    }

    fetchRelatedContent();
  }, [currentMovie, selectedGenre, selectedYear, selectedType]);

  console.log("Related Content", recommended);


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
              <VideoPlayer
                videoId={actualVideoUrl}
                // last_position={lastPausedTime}
                setCurrentMovie={setCurrentMovie}
                type={type}
                setFinal={setFinal}
                setActualVideoUrl={setActualVideoUrl}
                playlistItems={playlists}
                movieId={movieid}
                userid="03fa9a91-4281-4bd4-9e60-4da2ba72b0f3"
                playlistInfo={playlistInfo}
                ref={parentRef}
              />


            </div>
            {/* Overlays */}
          </div>
          {/* Episode Selection for Series */}
          {/* Episode Selection for Series */}
                {seasons.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-white text-2xl font-bold">Episodes</h2>
                      
                      {/* Season Dropdown */}
                      <div className="flex items-center gap-3">
                        <span className="text-white/60 text-sm">Season:</span>
                        <select
                          value={selectedSeasonId}
                          onChange={(e) => setSelectedSeasonId(e.target.value)}
                          className="bg-white/10 text-white px-4 py-2 rounded-lg border border-white/20 outline-none focus:border-blue-500 transition-colors cursor-pointer"
                        >
                          {seasons.map((season) => (
                            <option key={season.id} value={season.id} className="bg-[#1a1a1a]">
                              {season.title || `Season ${season.season_number}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

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
                            setMovieid(episode.id)
                            // Scroll to player
                            setMovies([episode])
                            playerRef.current?.scrollIntoView({ behavior: "smooth" });
                          }}
                        >
                          <div className="bg-white/5 rounded-lg overflow-hidden">
                            <div className="relative aspect-video bg-slate-900">
                              <img
                                src={episode.thumbnail_url || videoUrl.poster_url || "/placeholder.jpg"}
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
                              {/* Play Icon Overlay */}
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
          {currentMovie && (
            <div
              className="relative rounded-lg overflow-hidden mb-12 min-h-[300px] min-w-full"
              style={{
                backgroundImage: currentMovie.poster_url
                  ? `linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.95) 100%), url(${currentMovie.poster_url})`
                  : `linear-gradient(135deg, #1e293b 0%, #0f172a 100%)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="p-8 flex gap-8">
                {/* Poster */}
                <div className="flex-shrink-0">
                  <img
                    src={getOptimizedImageUrl(currentMovie.poster_url, 400)}
                    alt={currentMovie.content_title || currentMovie.title}
                    className="w-48 h-72 object-cover rounded-lg shadow-2xl"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 text-white">
                  <h1 className="text-4xl font-bold mb-4">
                    {currentMovie.content_title || currentMovie.title}
                  </h1>

                  <div className="flex items-center gap-4 mb-6 text-sm">
                    {currentMovie.year && (
                      <span className="px-3 py-1 bg-white/10 rounded">{currentMovie.year}</span>
                    )}
                    {currentMovie.genre && (
                      <span className="px-3 py-1 bg-white/10 rounded">{currentMovie.genre}</span>
                    )}
                    {currentMovie.type && (
                      <span className="px-3 py-1 bg-white/10 rounded capitalize">{currentMovie.type}</span>
                    )}
                    {currentMovie.duration_minutes && (
                      <span className="px-3 py-1 bg-white/10 rounded">{currentMovie.duration_minutes} min</span>
                    )}
                    {currentMovie.rating && (
                      <span className="px-3 py-1 bg-yellow-500/20 rounded">⭐ {currentMovie.rating}</span>
                    )}
                  </div>

                  {currentMovie.description && (
                    <p className="text-white/80 text-lg leading-relaxed mb-6 max-w-3xl">
                      {currentMovie.description}
                    </p>
                  )}

                  {currentMovie.episodes && (
                    <div className="mt-4">
                      <span className="text-white/60">Episodes: </span>
                      <span className="text-white font-semibold">{currentMovie.episodes}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Filters Section */}
          <div className="mb-8">
            // In your Parent Page/Component
                <RecommendedSection 
                    recommended={recommended} // The object { genre_based: [...], popular: [...] }
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
              {/* Genre Filter */}
               {/* <Select onValueChange={(e) => setSelectedGenre(e.target.value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select a Genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* <SelectGroup> */}
                        
                        {/* {genres.map(genre => (
                          // <SelectLabel>Genres</SelectLabel>
                         <SelectItem value={genre}>{genre}</SelectItem>
                      ))} */}
                      {/* </SelectGroup> */}
                    {/* </SelectContent> */}
              
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {relatedContent.map((content) => (
              <div
                key={content.id}
                className="cursor-pointer basis-[350px] max-w-[350px]"
                onClick={() => {
                  handleRelatedClick(content.id)
                  setMovieid(content.id)
                  // Now switch to new content
                  setActualVideoUrl(content.video_url);
                  setMovies([content]);
                  setVideoEnded(false);
                  setPlaylists([])
                }}



              >
                <div className="relative aspect-square rounded-lg overflow-hidden bg-white/5 h-[50%] w-full">
                  <img
                    src={getOptimizedImageUrl(content.poster_url, 400)}
                    alt={content.content_title || content.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="text-white text-sm font-semibold">
                        {content.content_title || content.title}
                      </div>
                      {content.year && (
                        <div className="text-white/60 text-xs">{content.year}</div>
                      )}
                    </div>
                  </div>
                </div>
                <div
                  className="h-[0.175rem] bg-red-900"
                  style={{ width: `${content?.watch_percentage}%` }}
                ></div>
                <div className="text-white font-medium truncate">
                  {content.content_title || content.title}
                </div>
                <div className="flex items-center gap-2 text-sm text-white/60 mt-1">
                  {content.year && <span>{content.year}</span>}
                  {content.genre && (
                    <>
                      <span>•</span>
                      <span>{content.genre}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullscreenPlayer;