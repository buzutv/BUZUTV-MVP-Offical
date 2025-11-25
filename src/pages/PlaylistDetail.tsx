import FullscreenPlayer from '@/components/FullscreenPlayer'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import usePlaylists from '@/hooks/usePlaylists'
import { supabase } from '@/integrations/supabase/client'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const PlaylistDetail = () => {
  const { id } = useParams()
  const { content, fetchSinglePlaylist } = usePlaylists()
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number | null>(null)
  const [isAutoPlay, setIsAutoPlay] = useState(true) // Toggle autoplay
  const [user_watch_history, setUserWatchHistory] = useState<any[]>([])
  const navigate = useNavigate()
  console.log("Content in PlaylistDetail:", content)
  useEffect(() => {
    if (id) fetchSinglePlaylist(id)
  }, [id])

  useEffect(() =>{
    async function loadWatchHistory() {
        if (content.length > 0) {
            // Fetch watch history or any other data if needed
            console.log("Content loaded in PlaylistDetail:", content);
            const fetchWatchHistoryPromises =  Promise.all(
                content.map(async (item) => {
                    const { data: historyData, error: historyError } = await supabase
                        .from("user_watch_history")
                        .select("*")
                        .eq("user_id","03fa9a91-4281-4bd4-9e60-4da2ba72b0f3")
                        .eq("movie_id",item.id);
                    if (historyError) {
                        console.log("Error fetching watch history:", historyError);
                        return null;
                    }
                    return {
                      ...item,
                      last_position: historyData[0]?.last_position || 0,
                      watch_duration: historyData[0]?.watch_duration || 0,
                      watch_percentage: historyData[0]?.watch_percentage || 0,
                      total_duration: historyData[0]?.total_duration || 0,
                      completed: historyData[0]?.completed || false,
                    
                    };
                })
            );  

            const data =  await fetchWatchHistoryPromises
            setUserWatchHistory(data)
          }
          

      }

    loadWatchHistory()
  },[content.length])


  console.log("User Watch History in PlaylistDetail:", user_watch_history)
  // Get the currently selected video
  const selectedVideo = currentVideoIndex !== null ? content[currentVideoIndex] : null

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
  }

  // Handle manual next/previous navigation
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

  // Handle close player
  const handleClose = () => {
    setCurrentVideoIndex(null)
  }

  // Play entire playlist from start
  const playPlaylist = () => {
    if (content.length > 0) {
      setCurrentVideoIndex(0)
      setIsAutoPlay(true)
    }
  }

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
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate(-1)}>
          <svg className="w-6 h-6" fill="none" stroke="white" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <p className="text-lg font-semibold text-white">Back</p>
        </div>
       
        

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
            className={`z-10 w-full cursor-pointer rounded-xl overflow-hidden shadow-md hover:shadow-lg transition bg-white-900 text-zinc-900 border-2 ${
              currentVideoIndex === index ? 'border-primary ring-2 ring-primary/50' : 'border-transparent'
            }`}
            onClick={() => setCurrentVideoIndex(index)}
          >
            <div className="relative">
              <img 
                src={item.poster_url}
                alt={item.title}
                className="w-full h-48 object-cover"
              />
              
              {/* Play icon overlay */}
              <div className="absolute inset-0 flex items-center  justify-center opacity-0 hover:opacity-100 transition">
                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>

              {/* Currently playing indicator */}
              {currentVideoIndex === index && (
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Playing
                </div>
              )}

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
          </div>
        ))}
      </div>

      {/* Render player with auto-play capability */}
      {selectedVideo && (
        <FullscreenPlayer
          isOpen={true}
          onClose={handleClose}
          videoUrl={selectedVideo.video_url}
          title={`${selectedVideo.title} (${currentVideoIndex! + 1}/${content.length})`}
          userId="03fa9a91-4281-4bd4-9e60-4da2ba72b0f3" // Replace with actual user ID from auth
          onVideoEnd={handleVideoEnd}
          // Additional props for playlist navigation
          hasNext={currentVideoIndex! < content.length - 1}
          hasPrevious={currentVideoIndex! > 0}
          onNext={handleNext}
          onPrevious={handlePrevious}
          playlistInfo={{
            current: currentVideoIndex! + 1,
            total: content.length,
            autoPlay: isAutoPlay
          }}
        />
      )}
    </div>
  )
}

export default PlaylistDetail