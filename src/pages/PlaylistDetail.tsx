import ContentModal from '@/components/ContentModal'
import FullscreenPlayer from '@/components/FullscreenPlayer'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/sonner'
import { useContent } from '@/hooks/useContent'
import { usePlaylistDetail } from '@/hooks/usePlaylistDetail'
import usePlaylists from '@/hooks/usePlaylists'
import { supabase } from '@/integrations/supabase/client'
import { useLazyGetPlaylistContentWithWatchHistoryQuery } from '@/store/contentSlice'
import { openScreenPlayer } from '@/store/screenPlayerSlice'
import { useLazyGetSeasonWithEpisodesQuery } from '@/store/seasonSlice'
import { fetchSeriesSeasons, getOptimizedImageUrl } from '@/utils/youtubeUtils'
import { Dialog, DialogContent } from '@radix-ui/react-dialog'
import { Plus, Trash } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'

const PlaylistDetail = () => {
  const { id } = useParams()
  // Ensure triggerPlaylistWithItemsById is destructured here
  const { playlistWithItems, triggerPlaylistWithItemsById } = usePlaylists()
  const { searchContentData } = useContent()
  
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number | null>(null)
  const [isAutoPlay, setIsAutoPlay] = useState(true)
  const [user_watch_history, setUserWatchHistory] = useState<any[]>([])
  const navigate = useNavigate()
  const [openDialog, setOpenDialog] = useState(false)
  
  // Key to manually trigger a history re-fetch
  const [historyUpdateKey, setHistoryUpdateKey] = useState(0)
  const [content, setContent] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedMovies, setSelectedMovies] = useState<string[]>([]);
  const [index, setIndex] = useState<number | null>(null);
  
  const [seasons, setSeasons] = useState<any[]>([]);
  const dispatch = useDispatch();
  
  const [triggerGetContentWithWatchHistory,result] = useLazyGetPlaylistContentWithWatchHistoryQuery()
  // const [triggerGetSeasonWithEpisodes] = useLazyGetSeasonWithEpisodesQuery()
  const { refetch } = usePlaylistDetail(
    content.length ? content.map(c => c.id) : undefined
  );
  // --- HARDCODED USER ID (From your original code) ---
  const USER_ID = "03fa9a91-4281-4bd4-9e60-4da2ba72b0f3";

  // 1. FIXED: Added 'playlistWithItems' to dependencies so UI updates when data is refetched
  useEffect(() => {
    const contentfromPlaylist = playlistWithItems?.find(playlist => playlist.id === id)?.playlist_items?.map(item => item.content) || [];
    dispatch(openScreenPlayer({
      playlistInfo: content.map(item => item.id),
      playlistId: id || null
    }))
    setContent(contentfromPlaylist);
  }, [id, playlistWithItems])

  useEffect(() => {
    if (id) triggerPlaylistWithItemsById({ userId: USER_ID, playlist_id: id })

    async function fetchRPC() {
      const { data } = await supabase.rpc('generate_all_recommendations', {
        user_id_param: USER_ID
      });
      return data
    }
    fetchRPC().then(data => console.log("Here is RPC Data", data))
  }, [id])

  // Function to increment key and force re-run of history logic
  const triggerHistoryRefresh = () => {
    console.log("Watch history refresh triggered. Incrementing key.");
    setHistoryUpdateKey(prev => prev + 1);
  }

  // Fetch watch history when content loads OR when historyUpdateKey changes
  useEffect(() => {
    async function loadWatchHistory() {
      if (content.length > 0) {
        const data = await triggerGetContentWithWatchHistory({ 
          userId: USER_ID, 
          contentIds: content.map(item => item.id) 
        }).unwrap()
        
        const normalized = data?.map((item) => {
          const [history] = item.user_watch_history ?? [];
          return {
            ...item,
            watch_percentage: history?.watch_percentage ?? 0,
            last_position: history?.last_position ?? 0,
            completed: history?.completed ?? false,
          }
        })
        setUserWatchHistory(normalized)
      }
    }
    
    loadWatchHistory()
    // We refetch the playlist wrapper here too
    refetch()
  }, [content?.length,content, historyUpdateKey, id])

  
  // Logic to determine what to display
  const displayItems = user_watch_history.length > 0 ? user_watch_history : content;
  const selectedVideo = currentVideoIndex !== null 
    ? (user_watch_history[currentVideoIndex] || content[currentVideoIndex]) 
    : null;

  // Fetch Seasons if Series
  useEffect(() => {
    async function fetchAndSetSeasonsData() {
      if (selectedVideo && selectedVideo.type === 'series') {
        const seasonsData = await fetchSeriesSeasons(selectedVideo.id);
        if (seasonsData) {
          setSeasons(seasonsData);
        } else {
          setSeasons([]);
        }
      }
    }
    fetchAndSetSeasonsData();
  }, [selectedVideo?.id])

  // --- HANDLERS ---

  const handleSearch = async (e: any) => {
    const value = e.target.value
    setSearch(value)

    if (value.trim().length === 0) {
      setSearchResults([])
      return
    }

    const data = await searchContentData(value)
    setSearchResults(data || [])
  }

  const handleVideoEnd = () => {
    if (currentVideoIndex === null || !isAutoPlay) return
    const nextIndex = currentVideoIndex + 1

    if (nextIndex < content.length) {
      setCurrentVideoIndex(nextIndex)
    } else {
      setCurrentVideoIndex(null)
    }
    triggerHistoryRefresh();
  }

  const handleNext = () => {
    if (currentVideoIndex === null) return
    const nextIndex = currentVideoIndex + 1
    if (nextIndex < content.length) {
      setCurrentVideoIndex(nextIndex)
    }
  }

  const handlePrevious = () => {
    if (currentVideoIndex === null) return
    const prevIndex = currentVideoIndex - 1
    if (prevIndex >= 0) {
      setCurrentVideoIndex(prevIndex)
    }
  }

  // 2. FIXED: Refetch everything when closing the player
  const handleClose = async () => {
    setCurrentVideoIndex(null)
    
    // Trigger the playlist fetch from Supabase again
    if(id) {
        triggerPlaylistWithItemsById({ userId: USER_ID, playlist_id: id });
    }

    // Trigger the history specific refresh
    triggerHistoryRefresh();
    const data = await triggerGetContentWithWatchHistory({ 
        userId: USER_ID, 
        contentIds: content.map(item => item.id) 
      }).unwrap()

    const normalized = data?.map((item) => {
          const [history] = item.user_watch_history ?? [];
          return {
            ...item,
            watch_percentage: history?.watch_percentage ?? 0,
            last_position: history?.last_position ?? 0,
            completed: history?.completed ?? false,
          }
        })
    setUserWatchHistory(normalized)
  }

  const handleMovies = async (movieIds: string[]) => {
    if (!id) return;
    const inserts = movieIds.map((movieId) => ({
      id: crypto.randomUUID(),
      playlist_id: id,
      content_id: movieId,
      position: 0
    }));

    const { error } = await supabase
      .from("playlist_items")
      .insert(inserts);

    if (error) {
      console.error("Error adding movies:", error);
      return;
    }

    // Refresh after adding
    if (id) triggerPlaylistWithItemsById({ userId: USER_ID, playlist_id: id });
    await refetch(id);
  }

  const playPlaylist = () => {
    if (content.length > 0) {
      setCurrentVideoIndex(0)
      setIsAutoPlay(true)
    }
  }

  const toggleMovieSelection = (movieId: string) => {
    setSelectedMovies(prev =>
      prev.includes(movieId)
        ? prev.filter(id => id !== movieId)
        : [...prev, movieId]
    );
  };

  const handleSubmitMovies = async () => {
    if (selectedMovies.length === 0) {
      toast.error("No movies selected!");
      return;
    }
    await handleMovies(selectedMovies);
    setSelectedMovies([]);
    setOpenDialog(false);
    toast.success("Movies added successfully!");
  };

  const handleDelete = async (e: any, item: any) => {
    e.stopPropagation(); 
    const { error } = await supabase
      .from("playlist_items")
      .delete()
      .match({
        content_id: item.id,
        playlist_id: id
      });

    if (!error) {
      toast.success("Item removed!");
      // Refetch logic
      if(id) triggerPlaylistWithItemsById({ userId: USER_ID, playlist_id: id });
      refetch(id);
    } else {
      console.error("Delete error:", error.message);
      return;
    }

    // Optimistic UI update
    setUserWatchHistory(prev => prev.filter(i => i.id !== item.id));
    setContent(prev => prev.filter(i => i.id !== item.id));
  };


  return (
    <div className="mt-24 p-10">
      <div className="fixed inset-0 -z-10"
        style={{
          background: `linear-gradient(200deg, #311066 0%, #1D0833 20%, #120222 45%, black 100%)`,
        }}
      ></div>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/playlists')}>
          <svg className="w-6 h-6" fill="none" stroke="white" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <p className="text-lg font-semibold text-white">Back</p>
        </div>

        <div className='flex gap-4'>
          <button
            className="flex items-center gap-2 px-6 py-3 bg-white rounded-lg hover:bg-foreground/90 hover:text-white transition font-semibold shadow-lg"
            onClick={() => setOpenDialog(true)}>
            <Plus className="w-5 h-5" />
            Add More Movies
          </button>

          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogContent className="bg-zinc-900 text-white p-6 rounded-xl min-w-[50%] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 h-auto overflow-y-auto border-2 border-white/10 max-h-[85vh]">
              <div className="fixed inset-0 -z-10"
                style={{
                  background: `linear-gradient(200deg, #311066 0%, #1D0833 20%, #120222 45%, black 100%)`,
                }}
              ></div>
              <h2 className="text-xl font-bold mb-4">Add Movies to Playlist</h2>

              <input
                type="text"
                placeholder="Search movies..."
                value={search}
                onChange={handleSearch}
                className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 mb-4"
              />

              <div className="grid grid-cols-3 gap-8 overflow-y-auto h-[50vh] pr-2">
                {searchResults.map((movie) => {
                  const isSelected = selectedMovies.includes(movie.id);
                  return (
                    <div
                      key={movie.id}
                      className={`relative h-48 rounded-xl cursor-pointer overflow-hidden shadow-md transition-transform ${isSelected ? "ring-4 ring-primary/70 scale-105 bg-black opacity-1 border-4 border-white" : "hover:scale-105"}`}
                      style={{
                        backgroundImage: `url(${movie.poster_url || movie.backdrop_url || "/placeholder.jpg"})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                      onClick={() => toggleMovieSelection(movie.id)}
                    >
                      <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-3">
                        <p className="font-bold text-white line-clamp-1">{movie.title}</p>
                        <p className="text-xs text-zinc-300">
                          {movie.year || "—"} • {movie.type || "Unknown"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleSubmitMovies}
                disabled={selectedMovies.length === 0}
                className="w-full mt-6 px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/80 shadow-lg transition"
              >
                Add Selected ({selectedMovies.length})
              </button>
            </DialogContent>
          </Dialog>

          {content?.length > 0 && (
            <button
              onClick={playPlaylist}
              className="flex items-center gap-2 px-6 py-3 bg-white rounded-lg hover:bg-foreground/90 hover:text-white transition font-semibold shadow-lg"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              Play All ({content.length})
            </button>
          )}
        </div>
      </div>

      {/* Autoplay Toggle */}
      <div className="flex items-center gap-3 mb-6 p-4 rounded-lg border-2 border-muted-foreground bg-foreground">
        <input
          type="checkbox"
          id="autoplay-toggle"
          checked={isAutoPlay}
          onChange={(e) => setIsAutoPlay(e.target.checked)}
          className="w-4 h-4 accent-primary cursor-pointer"
        />
        <label htmlFor="autoplay-toggle" className="cursor-pointer text-sm text-white font-medium">
          Autoplay next video in playlist
        </label>
      </div>

      {/* Loading State */}
      <div className='flex items-center gap-8 justify-start w-full'>
        {user_watch_history.length === 0 && content.length === 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 w-full">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div key={idx} className="rounded-xl overflow-hidden bg-white/5 backdrop-blur-md border border-white/10 shadow-md">
                <Skeleton className="w-full h-48" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4 bg-muted-foreground" />
                  <Skeleton className="h-3 w-1/2 bg-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
        {displayItems?.map((item, idx) => (
          <div
            key={item.id}
            className={`z-10 w-full cursor-pointer rounded-xl overflow-hidden shadow-md hover:shadow-lg transition bg-white-900 text-zinc-900 border-2 ${currentVideoIndex === idx ? 'border-primary ring-2 ring-primary/50' : 'border-transparent'}`}
            onClick={() => {
              setCurrentVideoIndex(idx)
              setIndex(idx)
              // Sync Redux player state just in case
              dispatch(openScreenPlayer({
                isOpen: true,
                contentItems: displayItems,
                startIndex: idx,
                selectedVideo: item,
                playlistId:id
              }))
            }}
          >
            <div className="relative">
              <img
                src={getOptimizedImageUrl(item.poster_url, 400)}
                alt={item.title}
                className="w-full h-48 object-cover"
              />

              <button
                onClick={(e) => handleDelete(e, item)}
                className="absolute bottom-2 right-2 p-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition shadow-md z-20"
              >
                <Trash className="w-4 h-4" />
              </button>
              
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>

              {currentVideoIndex === idx && (
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Playing
                </div>
              )}

              <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-semibold">
                #{idx + 1}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div
              className="h-[0.175rem] bg-red-900"
              style={{ width: `${item.watch_percentage}%` }}
            ></div>

            <div className="p-3 bg-muted-forground/10">
              <p className="font-semibold text-sm line-clamp-1 text-muted-foreground">{item.content_title || item.title}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {item.year || "—"} • {item.type}
              </p>
              {item.type === "series" && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  {item.seasons} season • {item.episodes} episodes
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Players */}
      {selectedVideo && (
        selectedVideo.type === 'series' ? (
          <ContentModal 
            isOpen={true}
            onClose={handleClose}
            item={selectedVideo}
            variant="series"
            seasons={seasons}
            movieId={selectedVideo?.id}
            hasNext={currentVideoIndex! < displayItems.length - 1}
            hasPrevious={currentVideoIndex! > 0}
            onNext={handleNext} 
            onPrevious={handlePrevious}
            playlistInfo={{
              current: currentVideoIndex! + 1,
              total: displayItems.length
            }}
          />
        ) : (
          <FullscreenPlayer
            isOpen={true}
            onClose={handleClose}
            videoUrl={selectedVideo?.video_url}
            type={selectedVideo?.type}
            title={`${selectedVideo?.title} (${currentVideoIndex! + 1}/${content.length})`}
            userId={USER_ID}
            onVideoEnd={handleVideoEnd}
            setSelectedVideo={setCurrentVideoIndex}
            movieId={selectedVideo?.id}
            hasNext={currentVideoIndex! < content?.length - 1}
            hasPrevious={currentVideoIndex! > 0}
            onNext={handleNext}
            onPrevious={handlePrevious}
            playlistInfo={{
              current: (index ?? 0) + 1,
              setIndex: setIndex,
              total: content?.length,
              autoPlay: isAutoPlay,
              totalMovies: user_watch_history?.length
            }}
            onWatchHistoryUpdate={triggerHistoryRefresh}
          />
        )
      )}

    </div>
  )
}

export default PlaylistDetail