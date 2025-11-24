import FullscreenPlayer from '@/components/FullscreenPlayer'
import usePlaylists from '@/hooks/usePlaylists'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const PlaylistDetail = () => {
  const { id } = useParams()
  const { content, fetchSinglePlaylist } = usePlaylists()
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number | null>(null)
  const [isAutoPlay, setIsAutoPlay] = useState(true) // Toggle autoplay
  const navigate = useNavigate()

  useEffect(() => {
    if (id) fetchSinglePlaylist(id)
  }, [id])

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate(-1)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <p className="text-lg font-semibold">Back</p>
        </div>

        {/* Play All Button */}
        {content.length > 0 && (
          <button
            onClick={playPlaylist}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-semibold shadow-lg"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
            Play All ({content.length})
          </button>
        )}
      </div>

      {/* Autoplay Toggle */}
      <div className="flex items-center gap-3 mb-6 p-4 bg-card rounded-lg border">
        <input
          type="checkbox"
          id="autoplay-toggle"
          checked={isAutoPlay}
          onChange={(e) => setIsAutoPlay(e.target.checked)}
          className="w-4 h-4 accent-primary cursor-pointer"
        />
        <label htmlFor="autoplay-toggle" className="cursor-pointer text-sm font-medium">
          Autoplay next video in playlist
        </label>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
        {content?.map((item, index) => (
          <div 
            key={item.id}
            className={`cursor-pointer rounded-xl overflow-hidden shadow-md hover:shadow-lg transition bg-card border-2 ${
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
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition">
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

            <div className="p-3">
              <p className="font-semibold text-sm line-clamp-1">{item.title}</p>
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