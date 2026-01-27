import ContentModal from '@/components/ContentModal'
import FullscreenPlayer from '@/components/FullscreenPlayer'
import { DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/sonner'
import { useAuth } from '@/contexts/AuthContext'
import { useContent } from '@/hooks/useContent'
import { usePlaylistDetail } from '@/hooks/usePlaylistDetail'
import usePlaylists from '@/hooks/usePlaylists'
import { supabase } from '@/integrations/supabase/client'
import { useLazyGetPlaylistContentWithWatchHistoryQuery } from '@/store/contentSlice'
import { openScreenPlayer, setContentId, setPlaylistInfo } from '@/store/screenPlayerSlice'
import { useLazyGetSeasonWithEpisodesQuery } from '@/store/seasonSlice'
import { fetchSeriesSeasons, getOptimizedImageUrl } from '@/utils/youtubeUtils'
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from '@radix-ui/react-dialog'
import { Plus, Trash, Search, X, CheckCircle2 } from 'lucide-react'
import { useAddPlaylistItemMutation, useRemovePlaylistItemMutation } from '@/store/playlistSlice'
import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'

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
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [seasons, setSeasons] = useState<any[]>([]);
  const dispatch = useDispatch();
  const { user } = useAuth()
  const [triggerGetContentWithWatchHistory, result] = useLazyGetPlaylistContentWithWatchHistoryQuery()
  const [addPlaylistItem] = useAddPlaylistItemMutation()
  const [removePlaylistItem] = useRemovePlaylistItemMutation()

  const { refetch } = usePlaylistDetail(
    content.length ? content.map(c => c.id) : undefined
  );


  // 1. FIXED: Added 'playlistWithItems' to dependencies so UI updates when data is refetched
  useEffect(() => {
    const currentPlaylist = playlistWithItems?.find(playlist => playlist.id === id);
    const contentfromPlaylist = currentPlaylist?.playlist_items?.map((item: any) => item.content) || [];

    setContent(contentfromPlaylist);

    // Sync with Redux for the active player
    if (currentPlaylist) {
      dispatch(setPlaylistInfo({ playlistInfo: currentPlaylist }));
    }
  }, [id, playlistWithItems, dispatch])

  useEffect(() => {
    if (id) triggerPlaylistWithItemsById({ userId: user?.id, playlist_id: id })

    async function fetchRPC() {
      const { data } = await supabase.rpc('generate_all_recommendations', {
        user_id_param: user?.id
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
          userId: user?.id,
          contentIds: content.map(item => item.id)
        }).unwrap()

        const normalized = content.map((contentItem) => {
          const refreshedItem = data?.find((item: any) => item.id === contentItem.id);
          const [history] = refreshedItem?.user_watch_history ?? [];
          return {
            ...(refreshedItem || contentItem),
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
  }, [content?.length, content, historyUpdateKey, id])


  // Logic to determine what to display
  const displayItems = user_watch_history.length > 0 ? user_watch_history : content;
  const selectedVideo = currentVideoIndex !== null
    ? (user_watch_history[currentVideoIndex] || content[currentVideoIndex])
    : null;


  console.log('Playlist Detail user watch his', user_watch_history)
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
    if (id) {
      triggerPlaylistWithItemsById({ userId: user?.id, playlist_id: id });
    }

    // Trigger the history specific refresh
    triggerHistoryRefresh();
    const data = await triggerGetContentWithWatchHistory({
      userId: user?.id,
      contentIds: content.map(item => item.id)
    }).unwrap()

    const normalized = content.map((contentItem) => {
      const refreshedItem = data?.find((item: any) => item.id === contentItem.id);
      const [history] = refreshedItem?.user_watch_history ?? [];
      return {
        ...(refreshedItem || contentItem),
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

    try {
      await addPlaylistItem(inserts).unwrap();
      toast.success("Movies added successfully!");
    } catch (error) {
      console.error("Error adding movies:", error);
      toast.error("Failed to add movies");
    }
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

  const handleDelete = async (item: any) => {
    if (!item) return;
    try {
      await removePlaylistItem({ contentId: item.id, playlistId: id! }).unwrap();
      toast.success(`${item.title} removed from playlist`);
      setItemToDelete(null);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to remove item");
    }
  };


  return (
    <div className="mt-24 p-10">
      <div className="fixed inset-0 -z-10"
        style={{
          background: `linear-gradient(200deg, #311066 0%, #1D0833 20%, #120222 45%, black 100%)`,
        }}
      ></div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 cursor-pointer z-10" onClick={() => navigate('/playlists')}>
          <svg className="w-6 h-6" fill="none" stroke="white" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <p className="text-lg font-semibold text-white">Back</p>
        </div>

        <div className='flex gap-4'>
          <Button
            // className="flex items-center gap-2 px-6 py-3 bg-white rounded-lg hover:bg-foreground/90 hover:text-white transition font-semibold shadow-lg"
            onClick={() => setOpenDialog(true)}>
            <Plus className="w-5 h-5" />
            Add More Movies
          </Button>

          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogPortal>
              <DialogOverlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
              <DialogContent className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-[#120222] border border-white/10 rounded-3xl shadow-2xl z-[60] overflow-hidden">
                <div className="absolute inset-0 -z-10 opacity-50"
                  style={{
                    background: `radial-gradient(circle at top left, #311066 0%, transparent 70%)`,
                  }}
                ></div>

                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-2">Add Content</h2>
                      <p className="text-white/60">Expand your collection with new movies and series</p>
                    </div>
                    <button
                      onClick={() => setOpenDialog(false)}
                      className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="relative mb-8 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-blue-400 transition-colors" />
                    <input
                      type="text"
                      placeholder="Search for movies, series..."
                      value={search}
                      onChange={handleSearch}
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
                    {searchResults.length === 0 && search && (
                      <div className="col-span-full py-12 text-center text-white/40">
                        No results found for "{search}"
                      </div>
                    )}
                    {searchResults.map((movie) => {
                      const isSelected = selectedMovies.includes(movie.id);
                      return (
                        <div
                          key={movie.id}
                          className={`relative aspect-[2/3] rounded-2xl cursor-pointer overflow-hidden transition-all duration-300 group/item ${isSelected
                            ? 'ring-2 ring-blue-500 scale-[0.98]'
                            : 'hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10'
                            }`}
                          onClick={() => toggleMovieSelection(movie.id)}
                        >
                          <img
                            src={getOptimizedImageUrl(movie.poster_url || movie.backdrop_url, 400)}
                            alt={movie.title}
                            className="w-full h-full object-cover"
                          />
                          <div className={`absolute inset-0 bg-black/40 flex flex-col justify-end p-4 transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100'}`}>
                            {isSelected && (
                              <div className="absolute top-2 right-2 text-blue-400">
                                <CheckCircle2 className="w-6 h-6 fill-blue-500 text-[#120222]" />
                              </div>
                            )}
                            <h4 className="font-bold text-white text-lg line-clamp-2 opacity-100">{movie?.title}</h4>
                            <span className="text-xs text-white/60 opacity-100">{movie.year || "—"} • {movie.type}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-8 flex items-center justify-between">
                    <p className="text-sm text-white/40">
                      {selectedMovies.length} items selected
                    </p>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setOpenDialog(false)}
                        className="px-6 py-3 rounded-xl hover:bg-white/5 text-white font-semibold transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmitMovies}
                        disabled={selectedMovies.length === 0}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-white/20 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                      >
                        Add to Playlist
                      </button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </DialogPortal>
          </Dialog>

          {/* {content?.length > 0 && (
            <button
              onClick={playPlaylist}
              className="flex items-center gap-2 px-6 py-3 bg-white rounded-lg hover:bg-foreground/90 hover:text-white transition font-semibold shadow-lg"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              Play All ({content.length})
            </button>
          )} */}
        </div>
      </div>

      {/* Autoplay Toggle */}
      {/* <div className="flex items-center gap-3 mb-4 p-4 rounded-lg border-2 border-muted-foreground bg-foreground z-150">
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
      </div> */}

      {/* Loading State */}
      <div className='flex items-center gap-8 justify-start w-full'>
        {user_watch_history.length === 0 && content.length === 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 gap-6 w-full">
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
      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {displayItems?.map((item, idx) => (
          <div
            key={item.id}
            // Added 'group' class here
            className={`group z-10 md:w-full cursor-pointer rounded-xl overflow-hidden shadow-md hover:shadow-lg transition bg-white text-zinc-900 border-2 ${currentVideoIndex === idx ? 'border-primary ring-2 ring-primary/50' : 'border-transparent'
              }`}
            onClick={() => {
              setCurrentVideoIndex(idx);
              const currentPlaylist = playlistWithItems?.find(playlist => playlist.id === id);
              dispatch(openScreenPlayer({
                isOpen: true,
                contentItems: displayItems,
                currentVideoIndex: idx,
                selectedVideo: item,
                playlistId: id,
                playlistInfo: currentPlaylist, // Re-provide playlistInfo on click
                isSeries: item.type === 'series'
              }))
              dispatch(setContentId({ contentId: item.id }));
            }}
          >
            <div className="relative">
              <img
                src={getOptimizedImageUrl(item.poster_url, 400)}
                alt={item.title}
                className="w-full h-48 object-cover"
              />

              {/* --- Centered Hover Overlay --- */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {/* Play Icon */}
                <div className="p-3 rounded-full bg-white/20 hover:bg-white/40 transition backdrop-blur-sm">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>

                {/* Trash Icon Button - ONLY opens dialog */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setItemToDelete(item);
                    setShowDeleteConfirm(true);
                  }}
                  className="p-3 rounded-full bg-red-600/80 text-white hover:bg-red-600 transition shadow-lg backdrop-blur-sm"
                >
                  <Trash className="w-6 h-6" />
                </button>
              </div>
              {/* --- End Overlay --- */}

              {/* Status Badges */}
              {currentVideoIndex === idx && (
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 z-20">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Playing
                </div>
              )}

              <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-semibold z-20">
                #{idx + 1}
              </div>
            </div>

            {/* Progress Bar */}
            <div
              className="h-[0.175rem] bg-red-600"
              style={{ width: `${item.watch_percentage}%` }}
            ></div>

            <div className="p-3 bg-white">
              <p className="font-semibold text-sm line-clamp-1 text-zinc-900">{item.content_title || item.title}</p>
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
            userId={user?.id}
            onVideoEnd={handleVideoEnd}
            setSelectedVideo={setCurrentVideoIndex}
            movieId={selectedVideo?.id}
            playlistId={id}
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

      {/* Global Deletion Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogPortal>
          <DialogOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
          <DialogContent className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#1a0b2e] border border-white/10 rounded-3xl shadow-2xl p-8 z-[110] outline-none">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Remove from Playlist?</h2>
              <p className="text-white/60 mb-8">
                Are you sure you want to remove <span className="text-white font-semibold">"{itemToDelete?.title}"</span>? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(itemToDelete)}
                  className="flex-1 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-600/20 transition-all active:scale-95"
                >
                  Yes, Remove
                </button>
              </div>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </div>
  )
}

export default PlaylistDetail