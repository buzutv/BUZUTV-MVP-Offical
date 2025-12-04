import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { getYouTubeEmbedUrl } from "@/utils/youtubeUtils";
import { supabase } from "../integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";

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
  onVideoEnd?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  playlistInfo?: {
    current: number;
    total: number;
    autoPlay: boolean;
    // id?:string
  };
}

const FullscreenPlayer = ({
  isOpen,
  onClose,
  videoUrl,
  title,
  userId,
  onVideoEnd,
  hasNext = false,
  hasPrevious = false,
  onNext,
  onPrevious,
  playlistInfo,
}: FullscreenPlayerProps) => {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);
  const currentVideoIdRef = useRef<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [movies, setMovies] = useState<any[]>([]);
  const [lastPausedTime, setLastPausedTime] = useState<number | null>(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [videoRestricted, setVideoRestricted] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const currentMovie = movies[0];
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [relatedContent, setRelatedContent] = useState<any[]>([]);
  const navigate = useNavigate();


  // Refs to hold latest values for callbacks to avoid dependency cycles
  const moviesRef = useRef(movies);
  const durationRef = useRef(duration);

  // Episode selection state for series
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [actualVideoUrl, setActualVideoUrl] = useState("");



  console.log("Actual Video Url", actualVideoUrl)
  console.log("Related Content", relatedContent)
  // Sync refs with state
  useEffect(() => {
    moviesRef.current = movies;
    durationRef.current = duration;
  }, [movies, duration]);

  // Parse seasons_data for series content
  useEffect(() => {
    if (typeof videoUrl === 'object' && videoUrl?.type === 'series' && videoUrl?.seasons_data) {
      try {
        const seasonsData = JSON.parse(videoUrl.seasons_data);
        const allEpisodes: Episode[] = [];

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
      setLastPausedTime(null);
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

      // Apply filters
      if (selectedGenre !== "All") {
        query = query.eq("genre", selectedGenre);
      }
      if (selectedYear !== "All") {
        query = query.eq("year", parseInt(selectedYear));
      }
      if (selectedType !== "All") {
        query = query.eq("type", selectedType);
      }

      const { data, error } = await query;
      if (!error && data) {
        setRelatedContent(data);
      }
    }

    fetchRelatedContent();
  }, [currentMovie, selectedGenre, selectedYear, selectedType]);

  // Fetch last paused time and check if completed
  useEffect(() => {
    if (!isOpen || !actualVideoUrl) return;

    async function fetchWatchHistory() {
      if (movies.length === 0) return;

      try {
        const { data, error } = await supabase
          .from("user_watch_history")
          .select("last_position, completed")
          .eq("user_id", userId)
          .eq("movie_id", movies[0]?.id)
          .single();

        if (error || !data) {
          setLastPausedTime(0);
        } else {
          setLastPausedTime(data.completed ? 0 : (data.last_position || 0));
        }
      } catch (err) {
        console.error("Error fetching watch history:", err);
        setLastPausedTime(0);
      }
    }

    fetchWatchHistory();
  }, [movies, isOpen, actualVideoUrl, userId]);

  // Countdown timer when video ends (handles both playlist and episode autoplay)
  useEffect(() => {
    const shouldAutoPlay = (hasNext && playlistInfo?.autoPlay) || episodes.length > 0;

    if (videoEnded && shouldAutoPlay && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (countdown === 0 && videoEnded) {
      // Handle episode autoplay
      if (episodes.length > 0 && currentEpisode) {
        const currentIndex = episodes.findIndex(
          ep => ep.episodeNumber === currentEpisode.episodeNumber &&
            ep.seasonNumber === currentEpisode.seasonNumber
        );

        if (currentIndex !== -1 && currentIndex < episodes.length - 1) {
          // Play next episode
          const nextEpisode = episodes[currentIndex + 1];
          setCurrentEpisode(nextEpisode);
          setActualVideoUrl(nextEpisode.videoUrl);
          setLastPausedTime(0);
          setDuration(0);
          setVideoEnded(false);
          setCountdown(5);
          return;
        }
      }

      // Handle playlist autoplay
      if (hasNext && playlistInfo?.autoPlay) {
        onVideoEnd?.();
        setCountdown(5);
      }
    }
  }, [videoEnded, countdown, hasNext, playlistInfo?.autoPlay, onVideoEnd, episodes, currentEpisode]);

  // Save watch history helper
  const saveWatchHistory = useCallback(async (pausedAt: number, completed: boolean = false) => {
    const currentMovies = moviesRef.current;
    const currentDuration = durationRef.current;

    if (!currentMovies[0]?.id) return;

    try {
      await supabase
        .from("user_watch_history")
        .upsert(
          {
            user_id: userId,
            movie_id: currentMovies[0]?.id,
            watched_at: new Date().toISOString(),
            last_position: Math.floor(pausedAt),
            watch_duration: Math.floor(currentDuration),
            watch_percentage: currentDuration > 0 ? Math.floor((pausedAt / currentDuration) * 100) : 0,
            total_duration: Math.floor(currentDuration),
            completed: completed || (currentDuration > 0 && pausedAt >= currentDuration - 5),
          },
          { onConflict: "user_id,movie_id" }
        );
    } catch (err) {
      console.error("Error saving watch history:", err);
    }
  }, [userId]);

  // Controls
  const handlePlayPause = useCallback(async () => {
    const player = playerInstanceRef.current;
    if (!player || typeof player.getCurrentTime !== 'function') return;

    if (isPlaying) {
      player.pauseVideo();
      const pausedAt = player.getCurrentTime();
      await saveWatchHistory(pausedAt, false);
    } else {
      player.playVideo();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, saveWatchHistory]);

  // Escape + scroll lock + keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      const player = playerInstanceRef.current;

      if (event.key === "Escape" && isOpen) {
        onClose?.();
      } else if (event.key === "ArrowRight" && player) {
        // Seek forward 10 seconds
        event.preventDefault();
        const currentTime = player.getCurrentTime();
        player.seekTo(currentTime + 10, true);
      } else if (event.key === "ArrowLeft" && player) {
        // Seek backward 10 seconds
        event.preventDefault();
        const currentTime = player.getCurrentTime();
        player.seekTo(Math.max(0, currentTime - 10), true);
      } else if (event.key === " " || event.key === "k") {
        event.preventDefault();
        await handlePlayPause();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, handlePlayPause]);

  // Initialize YouTube player
  useEffect(() => {
    if (!isOpen || !actualVideoUrl || lastPausedTime === null) return;

    const embedUrl = getYouTubeEmbedUrl(actualVideoUrl);
    const videoIdMatch = embedUrl?.match(/embed\/([^?]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    if (!videoId) return;

    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }

    const initPlayer = () => {
      if (playerInstanceRef.current) {
        if (currentVideoIdRef.current !== videoId) {
          currentVideoIdRef.current = videoId;
          playerInstanceRef.current.loadVideoById(videoId);
          if (lastPausedTime > 0) {
            setTimeout(() => {
              try { playerInstanceRef.current?.seekTo(lastPausedTime, true); } catch (e) { }
            }, 100);
          }
        }
        setVideoEnded(false);
        setVideoRestricted(false);
        setCountdown(5);
        return;
      }

      currentVideoIdRef.current = videoId;

      playerInstanceRef.current = new window.YT.Player(
        playerContainerRef.current,
        {
          videoId,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 1,
            controls: 1,
            rel: 0,
            playsinline: 1,
          },
          events: {
            onReady: (e: any) => {
              if (lastPausedTime > 0) {
                e.target.seekTo(lastPausedTime, true);
              }
              e.target.playVideo();
              setIsPlaying(true);
              const dur = e.target.getDuration();
              if (dur) setDuration(dur);
            },
            onStateChange: async (e: any) => {
              const player = e.target;

              if (e.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                const dur = player.getDuration();
                if (dur) setDuration(dur);
                setVideoEnded(false);
              }

              if (e.data === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false);
                saveWatchHistory(player.getCurrentTime(), false);
              }

              if (e.data === window.YT.PlayerState.ENDED) {
                setIsPlaying(false);
                setVideoEnded(true);
                saveWatchHistory(player.getCurrentTime(), true);
              }
            },
            onError: (e: any) => {
              if ([100, 101, 150].includes(e.data)) {
                setVideoRestricted(true);
                if (hasNext && onNext) {
                  setTimeout(() => onNext(), 2000);
                }
              }
            },
          },
        }
      );
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      (window as any).onYouTubeIframeAPIReady = initPlayer;
    }

  }, [isOpen, actualVideoUrl, lastPausedTime, hasNext, onNext]);

  // Clean up player on unmount
  useEffect(() => {
    return () => {
      if (playerInstanceRef.current && typeof playerInstanceRef.current.destroy === 'function') {
        playerInstanceRef.current.destroy();
        playerInstanceRef.current = null;
        currentVideoIdRef.current = null;
      }
    };
  }, []);

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

  const handleResultSelect = (result: any) => {
    // Navigate to the selected content
    navigate(`/content/${result.id}`);
  };

  // Extract unique values for filters
  const genres = ["All", "Action", "Comedy", "Drama", "Thriller", "Romance", "Sci-Fi"];
  const years = ["All", "2024", "2023", "2022", "2021", "2020"];
  const types = ["All", "movie", "series"];

  if (!isOpen) return null;

  console.log("Related Content:", relatedContent);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a0a] overflow-y-auto">
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: `
            linear-gradient(
              200deg,
              #311066 0%,
              #1D0833 20%,
              #120222 45%,
              black 100%
            )`,
        }}
      ></div>

      {/* Player Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-center items-center gap-6 mb-4">
          <div className="flex items-center justify-center gap-4 cursor-pointer flex-1" onClick={() => navigate("/playlists")}>
            <svg className="w-6 h-6" fill="none" stroke="white" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <p className="text-lg font-semibold text-white">Back</p>
          </div>
          <SearchBar
            onSearch={handleSearch}
            onResultSelect={handleResultSelect}
            results={searchResults}
            isLoading={isSearching}
            placeholder="Search to add movies..."
            className="mb-4 flex-3"
          />
        </div>

        <div className="aspect-video w-full bg-black rounded-lg overflow-hidden mb-8 relative">
          <div ref={playerContainerRef} className="w-full h-full" />

          {/* Overlays */}
          {videoRestricted && (
            <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-40">
              <div className="text-center">
                <div className="text-white text-2xl mb-4">
                  This video is restricted or unavailable
                </div>
                {hasNext && (
                  <div className="text-white/70">
                    Skipping to next video...
                  </div>
                )}
              </div>
            </div>
          )}

          {videoEnded && !videoRestricted && (
            // Determine if there's a next episode or playlist item
            (() => {
              const hasNextEpisode = episodes.length > 0 && currentEpisode &&
                episodes.findIndex(ep =>
                  ep.episodeNumber === currentEpisode.episodeNumber &&
                  ep.seasonNumber === currentEpisode.seasonNumber
                ) < episodes.length - 1;

              const showCountdown = hasNextEpisode || (hasNext && playlistInfo?.autoPlay);

              if (!showCountdown) return null;

              const currentIndex = episodes.findIndex(ep =>
                ep.episodeNumber === currentEpisode?.episodeNumber &&
                ep.seasonNumber === currentEpisode?.seasonNumber
              );
              const nextEpisode = hasNextEpisode ? episodes[currentIndex + 1] : null;

              return (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-40">
                  <div className="text-center">
                    <div className="text-white text-6xl font-bold mb-4 animate-pulse">
                      {countdown}
                    </div>
                    <div className="text-white text-2xl mb-2">
                      {nextEpisode
                        ? `Playing S${nextEpisode.seasonNumber} E${nextEpisode.episodeNumber}...`
                        : 'Playing next video...'
                      }
                    </div>
                    {nextEpisode && (
                      <div className="text-white/70 mb-2">
                        {nextEpisode.title}
                      </div>
                    )}
                    {playlistInfo && !nextEpisode && (
                      <div className="text-white/70">
                        {playlistInfo.current + 1} of {playlistInfo.total}
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setCountdown(0);
                        if (nextEpisode) {
                          setCurrentEpisode(nextEpisode);
                          setActualVideoUrl(nextEpisode.videoUrl);
                          setLastPausedTime(0);
                          setDuration(0);
                          setVideoEnded(false);
                          setCountdown(5);
                        } else {
                          onVideoEnd?.();
                        }
                      }}
                      className="mt-6 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition"
                    >
                      Play Now
                    </button>
                  </div>
                </div>
              );
            })()
          )}
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
                    // setLastPausedTime(0);
                    // setDuration(0);
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
                  src={currentMovie.poster_url}
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
          <div className="flex flex-wrap gap-4">
            {/* Genre Filter */}
            <div>
              <label className="text-white/60 text-sm mb-2 block bg-white/10 rounded-lg px-4 py-2">Genre</label>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
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
        <div className="flex flex-wrap gap-2">
          {relatedContent.map((content) => (
            <div
              key={content.id}
              className="group cursor-pointer flex-1 basis-[250px] max-w-[300px]"
              onClick={() => {
                setActualVideoUrl(content.video_url)
                // setLastPausedTime(0)
                setIsPlaying(true)
              }}
            >
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-3 bg-white/5 h-[50%] w-full">
                <img
                  src={content.poster_url}
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

      {/* Keyboard hints */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 text-white/40 text-sm bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
        Space: Play/Pause • ← →: Seek ±10s • Esc: Close
      </div>
    </div>
  );
};

export default FullscreenPlayer;