import FullscreenPlayer from '@/components/FullscreenPlayer'
import SearchOverlay from '@/components/SearchOverlay'
import { Button } from '@/components/ui/button'
import { DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/sonner'
import { Spinner } from '@/components/ui/spinner'
import { useContent } from '@/hooks/useContent'
import usePlaylists from '@/hooks/usePlaylists'
import { supabase } from '@/integrations/supabase/client'
import { fetchWatchHistory } from '@/utils/youtubeUtils'
import { Dialog, DialogContent } from '@radix-ui/react-dialog'
import { Plus, Trash } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const PlaylistDetail = () => {
  const { id } = useParams()
  const { content, fetchSinglePlaylist, refetch } = usePlaylists()
  const { searchContentData } = useContent()
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number | null>(null)
  const [isAutoPlay, setIsAutoPlay] = useState(true) // Toggle autoplay
  const [user_watch_history, setUserWatchHistory] = useState<any[]>([])
  const navigate = useNavigate()
  const [openDialog, setOpenDialog] = useState(false)
  // 1. NEW STATE: Key to manually trigger a history re-fetch
  const [historyUpdateKey, setHistoryUpdateKey] = useState(0)
  const [search, setSearch] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [selectedMovies, setSelectedMovies] = useState<string[]>([]);
  const [selectedVideo, setselectedVideo] = useState(null)

  // const { refetch } = usePlaylists()
  // Function to be passed to the player to trigger a re-fetch of history
  const triggerHistoryRefresh = () => {
    console.log("Watch history refresh triggered. Incrementing key.");
    setHistoryUpdateKey(prev => prev + 1);
  }


  console.log("Selected Video State", selectedVideo)
  // console.log("Selected Video State", user_watch_history[0])


  // Fetch playlist content only when ID changes
  useEffect(() => {
    if (id) fetchSinglePlaylist(id)
    refetch()
  }, [id, user_watch_history, setUserWatchHistory])

  // useEffect(() => {
  //   setselectedVideo(currentVideoIndex !== null ? content[currentVideoIndex] : null)
  // }, [currentVideoIndex])

  // Fetch watch history when content loads OR when historyUpdateKey changes
  useEffect(() => {
    async function loadWatchHistory() {
      if (content.length > 0) {
        console.log("Content loaded in PlaylistDetail. Fetching history...", content);

        // --- NOTE: You MUST replace this hardcoded user_id with the actual authenticated user's ID ---
        const USER_ID = "03fa9a91-4281-4bd4-9e60-4da2ba72b0f3";


        const dataWithHistory = await Promise.all(
          content.map(async (item) => {
            const history = await fetchWatchHistory(
              USER_ID,
              item?.id
            );

            console.log("History", history?.last_position)
            return {
              ...item,
              watch_percentage: history ? history.watch_percentage : 0,
              last_position: history?.last_position,
              completed: history?.completed
            };
          })
        );

        // fetchWatchHistoryPromises
        // Filter out any null entries if an error occurred in the map
        setUserWatchHistory(dataWithHistory)

        console.log("User Watch History in PlaylistDetail:", dataWithHistory[0].last_position)
      }

    }
    loadWatchHistory()
  }, [content.length, historyUpdateKey]) // 4. ADDED historyUpdateKey dependency
  console.log("Content in PlaylistDetail:", user_watch_history)

  // Get the currently selected video

  // console.log("User Watch History in PlaylistDetail:", JSON.stringify(selectedVideo?.seasons_data))

  const handleSearch = async (e) => {
    const value = e.target.value
    setSearch(value)

    if (value.trim().length === 0) {
      setSearchResults([])
      return
    }

    const data = await searchContentData(value)

    console.log("Search results in PlaylistDetail:", data)
    setSearchResults(data || [])
  }
  // Handle video end - auto-play next video
  const handleVideoEnd = () => {
    if (currentVideoIndex === null || !isAutoPlay) return

    const nextIndex = currentVideoIndex + 1

    if (nextIndex < content.length) {
      // Play next video automatically
      setCurrentVideoIndex(nextIndex)
    } else {
      // Playlist finished, close player
      setCurrentVideoIndex(null)
      // Optional: Show a "Playlist Complete" message or loop back to start
      // To loop: setCurrentVideoIndex(0)
    }
    // Refresh history immediately after a video ends (in case 'completed' status updated)
    triggerHistoryRefresh();
  }

  // Handle manual next/previous navigation
  const handleNext = () => {
    if (currentVideoIndex === null) return
    const nextIndex = currentVideoIndex + 1
    if (nextIndex < content.length) {
      setCurrentVideoIndex(nextIndex)
    }
  }

  const handleMovies = async (movieIds: string[]) => {
    if (!id) return;
    console.log("Adding movies to playlist:", movieIds);

    const inserts = movieIds.map((movieId) => ({
      id: crypto.randomUUID(),
      playlist_id: id,
      content_id: movieId,
      position: 0
      // added_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("playlist_items")
      .insert(inserts);

    if (error) {
      console.error("Error adding movies to playlist:", error);
      return;
    }

    // Refresh playlist content after adding movies
    await refetch(id);
    console.log("Movies added successfully to playlist.");
  }

  const handlePrevious = () => {
    if (currentVideoIndex === null) return
    const prevIndex = currentVideoIndex - 1
    if (prevIndex >= 0) {
      setCurrentVideoIndex(prevIndex)
    }
  }

  // Handle close player
  const handleClose = () => {
    setCurrentVideoIndex(null)
    // Refresh history when closing the player, ensuring the progress bar updates immediately

    triggerHistoryRefresh();
  }

  // Play entire playlist from start
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
    // Call your handler to add these movies to the playlist
    await handleMovies(selectedMovies);
    setSelectedMovies([]);
    setOpenDialog(false);
    toast.success("Movies added successfully!");
  };
  const handleDelete = async (e, item) => {
    e.stopPropagation(); // prevent opening video

    const { error } = await supabase
      .from("playlist_items")
      .delete()
      .match({
        content_id: item.id,
        playlist_id: id
      });

    if (!error) {
      refetch(id);
      toast.success("Item successfully removed from playlist!");
    }



    if (error) {
      console.error("Delete error:", error.message);
      return;
    }

    // Remove from UI state
    // refetch(id);
    setUserWatchHistory(prev =>
      prev.filter(item => item.id !== id)
    );
  };


  const CloseModal = () => {
    handleVideoEnd()
    setselectedVideo
  }

  // Use history data if available, otherwise use raw content (for safety during loading)
  const displayItems = user_watch_history.length > 0 ? user_watch_history : content;
  const isLoading = content.length > 0 && user_watch_history.length === 0;


  return (
    <div className="mt-24 p-10">
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: `
              linear-gradient(
                200deg,
                #311066 0%,   /* very dark violet */
                #1D0833 20%,  /* deep blackish purple */
                #120222 45%,  /* near-black violet */
                black 100%    /* pure black */
            `,
        }}
      ></div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/playlists')}>
          <svg className="w-6 h-6" fill="none" stroke="white" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <p className="text-lg font-semibold text-white">Back</p>
        </div>

        <div className='flex gap-4'>


          <button
            className="flex items-center gap-2 px-6 py-3 bg-white  rounded-lg hover:bg-foreground/90 hover:text-white transition font-semibold shadow-lg"
            onClick={() => setOpenDialog(true)}>
            <Plus className="w-5 h-5" />
            Add More Movies
          </button>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogContent className="bg-zinc-900 text-white p-6 rounded-xl min-w-[50%] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 h-auto overflow-y-auto border-2 border-white/10 overflow-y-scroll">
              <div
                className="fixed inset-0 -z-10"
                style={{
                  background: `
              linear-gradient(
                200deg,
                #311066 0%,   /* very dark violet */
                #1D0833 20%,  /* deep blackish purple */
                #120222 45%,  /* near-black violet */
                black 100%    /* pure black */
            `,
                }}
              ></div>
              <h2 className="text-xl font-bold mb-4">Add Movies to Playlist</h2>

              {/* Search Input */}
              <input
                type="text"
                placeholder="Search movies..."
                value={search}
                onChange={(e) => handleSearch(e)}
                className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 mb-4"
              />

              {/* Movie Grid */}
              <div className="grid grid-cols-3 gap-8 overflow-hidden h-[65vh]">
                {searchResults.map((movie) => {
                  const isSelected = selectedMovies.includes(movie.id);
                  return (
                    <div
                      key={movie.id}
                      className={`relative h-48 rounded-xl cursor-pointer overflow-hidden shadow-md transition-transform ${isSelected ? "ring-4 ring-primary/70 scale-105 bg-black opacity-1 border-4 border-white" : "hover:scale-105"
                        }`}
                      style={{
                        backgroundImage: `url(${movie.poster_url || movie.backdrop_url || "/placeholder.jpg"})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        opacity: isSelected ? 1 : 0.8,
                        backgroundColor: isSelected ? "purple" : "transparent"
                      }}
                      onClick={() => toggleMovieSelection(movie.id)}
                    >
                      {/* Overlay for darkening and info */}
                      <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-3">
                        <p className="font-bold text-white line-clamp-1">{movie.title}</p>
                        <p className="text-xs text-zinc-300">
                          {movie.year || "—"} • {movie.type || "Unknown"}
                        </p>
                        {movie.rating && (
                          <p className="text-xs text-yellow-400 mt-1">⭐ {movie.rating}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitMovies}
                disabled={selectedMovies?.length === 0}
                className="fixed bottom-6 right-6 px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/80 shadow-lg transition"
              >
                Add Selected ({selectedMovies?.length})
              </button>
            </DialogContent>
          </Dialog>




          {/* Play All Button */}
          {content.length > 0 && (
            <button
              onClick={playPlaylist}
              className="flex items-center gap-2 px-6 py-3 bg-white  rounded-lg hover:bg-foreground/90 hover:text-white transition font-semibold shadow-lg"
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



      <div className='flex items-center gap-8 justify-start w-full'>
        {user_watch_history.length === 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 w-full">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-xl overflow-hidden bg-white/5 backdrop-blur-md border border-white/10 shadow-md"
              >
                {/* Poster skeleton */}
                <Skeleton className="w-full h-48" />

                {/* Text skeletons */}
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4 bg-muted-foreground" />
                  <Skeleton className="h-3 w-1/2 bg-muted-foreground" />
                  <Skeleton className="h-3 w-2/3 bg-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
        {user_watch_history.length > 0 && user_watch_history?.map((item, index) => (
          <div
            key={item.id}
            className={`z-10 w-full cursor-pointer rounded-xl overflow-hidden shadow-md hover:shadow-lg transition bg-white-900 text-zinc-900 border-2 ${currentVideoIndex === index ? 'border-primary ring-2 ring-primary/50' : 'border-transparent'
              }`}
            onClick={() => {
              setCurrentVideoIndex(index)
              setselectedVideo(item)
              // triggerHistoryRefresh()
            }}
          >
            <div className="relative">
              <img
                src={item.poster_url}
                alt={item.title}
                className="w-full h-48 object-cover"
              />

              <button
                onClick={(e) => handleDelete(e, item)}
                className="absolute bottom-2 right-2 p-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition shadow-md z-20"
              >
                <Trash className="w-4 h-4" />
              </button>
              {/* Play icon overlay */}
              <div className="absolute inset-0 flex items-center  justify-center opacity-0 hover:opacity-100 transition">
                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>

              {/* Currently playing indicator */}
              {/* {currentVideoIndex === index && (
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Playing
                </div>
              )} */}

              {/* Episode number badge */}
              <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-semibold">
                #{index + 1}
              </div>
            </div>
            <div
              className="h-[0.175rem] bg-red-900"
              style={{ width: `${item.watch_percentage}%` }}
            ></div>

            <div className="p-3 bg-muted-forground/10">
              <p className="font-semibold text-sm line-clamp-1 text-muted-foreground">{item.content_title}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {item.year || "—"} • {item.type}
              </p>


              {item.type === "series" && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  {item.seasons} season • {item.episodes} episodes
                </p>
              )}

            </div>


            {/* Delete button */}


          </div>
        ))}
      </div>

      {/* Render player with auto-play capability */}
      {selectedVideo && (
        <FullscreenPlayer
          isOpen={true}
          onClose={handleClose}
          videoUrl={selectedVideo.type === "series" ? selectedVideo : selectedVideo.video_url}
          type={selectedVideo.type}
          title={`${selectedVideo.title} (${currentVideoIndex! + 1}/${content.length})`}
          userId="03fa9a91-4281-4bd4-9e60-4da2ba72b0f3" // Replace with actual user ID from auth
          onVideoEnd={handleVideoEnd}
          setSelectedVideo={setselectedVideo}
          // Additional props for playlist navigation
          // video={selectedVideo}
          movieId={selectedVideo.id}
          hasNext={currentVideoIndex! < content.length - 1}
          hasPrevious={currentVideoIndex! > 0}
          onNext={handleNext}
          onPrevious={handlePrevious}
          playlistInfo={{
            current: currentVideoIndex! + 1,
            total: content.length,
            autoPlay: isAutoPlay,
            // id:selectedVideo.id
          }}
          onWatchHistoryUpdate={triggerHistoryRefresh}
        />
      )}

    </div>
  )
}

export default PlaylistDetail