import PlaylistDialog from '@/components/PlaylistDialog'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import usePlaylists from '@/hooks/usePlaylists'
import { useEffect } from 'react'
// import React from 'react'

const PlayList = () => {
  const { playlists,fetchSinglePlaylist } = usePlaylists()

  console.log("playlists found", playlists)
 
  return (
    <div className='m-16'>
        <div className='text-3xl font-bold mb-8'>Playlists</div>
         
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {playlists.map((pl) => (
        <Card key={pl.id} className="p-4 rounded-2xl shadow-sm border cursor-pointer" onClick={() => fetchSinglePlaylist(pl.id)}>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              {pl.title}
            </CardTitle>
            <CardDescription>
              {pl.description || "No description"}
            </CardDescription>
          </CardHeader>

          <div className="px-4 pb-4 text-sm text-muted-foreground">
            <p>Created: {new Date(pl.created_at).toLocaleDateString()}</p>
          </div>
        </Card>
      ))}
    </div>

        
    </div>
  )
}

export default PlayList 