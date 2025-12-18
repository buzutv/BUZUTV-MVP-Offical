import { fetchSeriesSeasons, fetchWatchHistory, getOptimizedImageUrl, getRecommendedMovies, getYouTubeEmbedUrl, saveWatchHistory } from "@/utils/youtubeUtils";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import SearchBar from "./SearchBar";
import VideoPlayer from "./VideoPlayer";
import usePlaylists from "@/hooks/usePlaylists";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  // Sync refs with state
  const parentRef = useRef()
  useEffect(() => {
    moviesRef.current = movies;
    durationRef.current = duration;
    currentMovieIdRef.current = movies[0]?.id || null;
    setCurrentMovie(movies[0])
  }, [movies, duration]);

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
    if (typeof videoUrl === 'object' && videoUrl?.type === 'series' && videoUrl?.seasons_data) {
      try {
        const seasonsData = JSON.parse(videoUrl.seasons_data);
        const allEpisodes: Episode[] = [];
        console.log("Selected Video URl", videoUrl)
        const seasons = await fetchSeriesSeasons(videoUrl.id)
        console.log("Seasons Content fetched", seasons)
        seasonsData.forEach((season: any) => {
          season.episodes?.forEach((episode: any) => {
            allEpisodes.push({
              ...episode,
              seasonNumber: season.seasonNumber
            });
          });
        });

        setEpisodes(allEpisodes);

        // Auto-select first episode
        if (allEpisodes.length > 0 && !currentEpisode) {
          setCurrentEpisode(allEpisodes[0]);
          setActualVideoUrl(allEpisodes[0].videoUrl);
        }
      } catch (error) {
        console.error('Error parsing seasons_data:', error);
      }
    } else if (typeof videoUrl === 'string') {
      // Regular movie
      setEpisodes([]);
      setCurrentEpisode(null);
      setActualVideoUrl(videoUrl);
    }
  }

  parseSeasonsData()
  }, [videoUrl]);

  // Fetch movie data from Supabase
  useEffect(() => {
    async function fetchMovies() {
      // For series, query by ID instead of video_url
      if (typeof videoUrl === 'object' && videoUrl?.id) {
        const { data, error } = await supabase
          .from("content")
          .select("*")
          .eq("id", videoUrl.id);

        // const {data:seasonsData} = await supabase
        // .from("seasons")
        // .select("*")
        // .eq("content_uuid", videoUrl.id)


        // console.log("Seasons Data", seasonsData)
        if (error) {
          console.error("Error fetching movies:", error);
        } else {
          setMovies(data || []);
        }
        return;
      }

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

    if (actualVideoUrl || (typeof videoUrl === 'object' && videoUrl?.id)) {
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
      console.log("Here are the recommendations", recommend)
      setRecommended(recommend)
    }

    fetchRelatedContent();
  }, [currentMovie, selectedGenre, selectedYear, selectedType]);

  console.log("Related Content", relatedContent);


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
          {episodes.length > 0 && (
            <div className="mb-8">
              <h2 className="text-white text-2xl font-bold mb-4">Episodes</h2>
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {episodes.map((episode) => (
                  <div
                    key={`${episode.seasonNumber}-${episode.episodeNumber}`}
                    className={`flex-shrink-0 w-80 cursor-pointer group snap-start transition-all duration-300 ${currentEpisode?.episodeNumber === episode.episodeNumber &&
                      currentEpisode?.seasonNumber === episode.seasonNumber
                      ? 'ring-2 ring-blue-500'
                      : 'hover:ring-2 hover:ring-white/30'
                      }`}
                    onClick={() => {
                      setCurrentEpisode(episode);
                      setActualVideoUrl(episode.videoUrl);
                      setVideoEnded(false);
                    }}
                  >
                    <div className="bg-white/5 rounded-lg overflow-hidden">
                      <div
                        className="relative aspect-video"
                        style={{
                          backgroundImage: videoUrl.poster_url
                            ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url(${videoUrl.poster_url})`
                            : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      >
                        {!videoUrl.poster_url && (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-16 h-16 text-white/20" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        {currentEpisode?.episodeNumber === episode.episodeNumber &&
                          currentEpisode?.seasonNumber === episode.seasonNumber && (
                            <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                              Now Playing
                            </div>
                          )}
                      </div>
                      <div className="p-4">
                        <div className="text-white/60 text-sm mb-1">
                          S{episode.seasonNumber} E{episode.episodeNumber}
                        </div>
                        <h3 className="text-white font-semibold mb-2 line-clamp-1">
                          {episode.title}
                        </h3>
                        {episode.description && (
                          <p className="text-white/60 text-sm line-clamp-2 mb-2">
                            {episode.description}
                          </p>
                        )}
                        {episode.rating && (
                          <div className="text-yellow-400 text-sm">
                            ⭐ {episode.rating}
                          </div>
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
            <h2 className="text-white text-2xl font-bold mb-4">More Like This</h2>
            <div className="mt-6 mb-6">
                <h2 className="mb-4 inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white/70 backdrop-blur">
                  Recommended For You
                </h2>
                {
                  recommended.length === 0 ? (<div className="flex flex-wrap gap-5">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="w-[200px]">
                        <div className="relative aspect-square overflow-hidden rounded-xl bg-white/5 shadow-md">
                          {/* Image skeleton */}
                          <div className="h-full w-full animate-pulse bg-gradient-to-br from-white/10 via-white/5 to-white/10" />

                          {/* Text skeleton */}
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <div className="mb-2 h-3 w-3/4 rounded bg-white/20 animate-pulse" />
                            <div className="h-2 w-1/3 rounded bg-white/10 animate-pulse" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>) 
                  :(
                    <div className="flex flex-wrap gap-5">
                      {recommended.map((rec) => (
                        <div
                          key={rec.id}
                          onClick={() => {
                                handleRelatedClick(rec?.details?.id)
                                setMovieid(rec?.details?.id)
                                // Now switch to new content
                                setActualVideoUrl(rec?.details?.video_url);
                                setMovies([rec?.details]);
                                setVideoEnded(false);
                                setPlaylists([])
                              }}
                          className="group w-[200px] cursor-pointer"
                        >
                          <div className="relative aspect-square overflow-hidden rounded-xl bg-white/5 shadow-md transition-all duration-300 hover:shadow-xl">
                            <img
                              src={getOptimizedImageUrl(rec?.details?.poster_url, 400)}
                              alt={rec.content_title || rec.title}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />

                            {/* Overlay */}
                            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                              <div className="p-3">
                                <p className="text-sm font-semibold text-white leading-tight">
                                  {rec.content_title || rec.title}
                                </p>
                                {rec.year && (
                                  <p className="text-xs text-white/60">{rec.year}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                }
                  

            </div>

            <div className="flex flex-wrap gap-4">
              {/* Genre Filter */}
               <Select onValueChange={(e) => setSelectedGenre(e.target.value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select a Genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* <SelectGroup> */}
                        
                        {genres.map(genre => (
                          // <SelectLabel>Genres</SelectLabel>
                         <SelectItem value={genre}>{genre}</SelectItem>
                      ))}
                      {/* </SelectGroup> */}
                    </SelectContent>
                </Select>
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
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