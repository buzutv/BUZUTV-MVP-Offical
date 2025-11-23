import PlaylistDialog from '@/components/PlaylistViewDialog'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import usePlaylists from '@/hooks/usePlaylists'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
// import PlaylistDialog from '@/components/PlaylistViewDialog'
// import React from 'react'

const PlayList = () => {
  const { playlists, fetchSinglePlaylist, content } = usePlaylists()
  const navigate = useNavigate()
  return (
    <div className="m-16">
      <div className='text-3xl font-bold mb-8'>Playlists</div>

      {/* Playlists Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {playlists.map((pl) => (
          <Card
            key={pl.id}
            onClick={() => navigate(pl.id)}
            className="p-4 rounded-2xl shadow-sm border cursor-pointer"
          >
            <CardHeader>
              <CardTitle>{pl.title}</CardTitle>
              <CardDescription>{pl.description || "No description"}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Playlist Dialog */}
      {/* {playlists && content &&  (
        <PlaylistDialog
          playlist={playlists}
          items={content}
        />
      )} */}
    </div>
  )
}

export default PlayList 