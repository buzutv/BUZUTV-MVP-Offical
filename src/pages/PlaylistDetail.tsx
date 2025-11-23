import FullscreenPlayer from '@/components/FullscreenPlayer'
import usePlaylists from '@/hooks/usePlaylists'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const PlaylistDetail = () => {
  const { id } = useParams()
  const { content, fetchSinglePlaylist } = usePlaylists()
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number | null>(null) // Track index instead of video object
  const navigate = useNavigate()

  useEffect(() => {
    if (id) fetchSinglePlaylist(id)
  }, [id])

  // Get the currently selected video
  const selectedVideo = currentVideoIndex !== null ? content[currentVideoIndex] : null

  // Handle video end - auto-play next video
  const handleVideoEnd = () => {
    if (currentVideoIndex === null) return
    
    const nextIndex = currentVideoIndex + 1
    
    if (nextIndex < content.length) {
      // Play next video
      setCurrentVideoIndex(nextIndex)
    } else {
      // Playlist finished, close player
      setCurrentVideoIndex(null)
      // Optional: Show a "Playlist Complete" message
    }
  }

  // Handle close player
  const handleClose = () => {
    setCurrentVideoIndex(null)
  }

  return (
    <div className="mt-24 p-10">
      <div className='flex item-center gap-4' onClick={() => navigate(-1)}>
        <p>back</p>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
        {content?.map((item, index) => (
          <div 
            key={item.id}
            className="cursor-pointer rounded-xl overflow-hidden shadow-md hover:shadow-lg transition bg-card border"
            onClick={() => setCurrentVideoIndex(index)} // Set index instead of item
          >
            <img 
              src={item.poster_url}
              alt={item.title}
              className="w-full h-48 object-cover"
            />

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
          title={selectedVideo.title}
          userId="03fa9a91-4281-4bd4-9e60-4da2ba72b0f3"
          onVideoEnd={handleVideoEnd} // Pass the callback
        />
      )}
    </div>
  )
}

export default PlaylistDetail