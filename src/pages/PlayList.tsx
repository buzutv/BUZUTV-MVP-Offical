import { Skeleton } from "@/components/ui/skeleton"
import usePlaylists from "@/hooks/usePlaylists"
import { useNavigate } from "react-router-dom"

const PlayList = () => {
  const { playlists } = usePlaylists()
  const navigate = useNavigate()

  // if (!playlists || playlists.length === 0) return null

  return (
    <div className="p-10 mt-24">
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

      <div className='flex items-center gap-8 justify-start w-full'>
          {playlists.length === 0 && (
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
      <div className="flex items-center justify-start gap-10">


      {playlists.map((playlist) => {
        const items = playlist.items || []
        const previews = items.slice(0, 3) // first 3 thumbnails

        return (
          <div
            key={playlist.id}
            className="w-[350px] h-[250px] cursor-pointer mb-10"
            onClick={() => navigate(`/playlists/${playlist.id}`)}
          >
            {/* Stacked thumbnails */}
           <div className="relative h-[300px] mb-4">
          {previews.map((item, i) => (
            <img
              key={item.id}
              src={item.poster_url ?? ""}
              className={`absolute left-0 w-full h-[300px] rounded-xl shadow-lg object-cover 
                transition-all duration-300
                ${i === 0 ? "z-30 top-0 scale-105" : ""}
                ${i === 1 ? "z-20 top-4 scale-95" : ""}
                ${i === 2 ? "z-10 top-8 scale-90" : ""}
              `}
            />
          ))}
        </div>

            {/* Title & count */}
            <div className="mt-3">
              <p className="font-semibold text-white">{playlist.title}</p>
              <p className="text-sm text-gray-400">{items.length} videos</p>
            </div>
          </div>
        )
      })}
      </div>
    </div>
  )
}

export default PlayList
