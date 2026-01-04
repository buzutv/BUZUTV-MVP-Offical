
import { useSelector } from 'react-redux';
import { getOptimizedImageUrl } from '../utils/youtubeUtils';
const MovieDetailSection = () => {
const currentMovie = useSelector((state: any) => state.screenPlayer.selectedVideo);
  return (
  
        <div
        className="relative rounded-lg overflow-hidden mb-12 min-h-[300px] min-w-full"
        style={{
            backgroundImage: currentMovie?.poster_url
            ? `linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.95) 100%), url(${currentMovie?.poster_url})`
            : `linear-gradient(135deg, #1e293b 0%, #0f172a 100%)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        }}
        >
        <div className="p-8 flex gap-8">
            {/* Poster */}
            <div className="flex-shrink-0">
            <img
                src={getOptimizedImageUrl(currentMovie?.poster_url, 400)}
                alt={currentMovie?.content_title || currentMovie?.title}
                className="w-48 h-72 object-cover rounded-lg shadow-2xl"
            />
            </div>

            {/* Details */}
            <div className="flex-1 text-white">
            <h1 className="text-4xl font-bold mb-4">
                {currentMovie?.content_title || currentMovie?.title}
            </h1>

            <div className="flex items-center gap-4 mb-6 text-sm">
                {currentMovie?.year && (
                <span className="px-3 py-1 bg-white/10 rounded">{currentMovie?.year}</span>
                )}
                {currentMovie?.genre && (
                <span className="px-3 py-1 bg-white/10 rounded">{currentMovie?.genre}</span>
                )}
                {currentMovie?.type && (
                <span className="px-3 py-1 bg-white/10 rounded capitalize">{currentMovie?.type}</span>
                )}
                {currentMovie?.duration_minutes && (
                <span className="px-3 py-1 bg-white/10 rounded">{currentMovie?.duration_minutes} min</span>
                )}
                {currentMovie?.rating && (
                <span className="px-3 py-1 bg-yellow-500/20 rounded">⭐ {currentMovie?.rating}</span>
                )}
            </div>

            {currentMovie?.description && (
                <p className="text-white/80 text-lg leading-relaxed mb-6 max-w-3xl">
                {currentMovie.description}
                </p>
            )}

            {currentMovie?.episodes && (
                <div className="mt-4">
                <span className="text-white/60">Episodes: </span>
                <span className="text-white font-semibold">{currentMovie?.episodes}</span>
                </div>
            )}
            </div>
        </div>
        </div>

       
        

  
    )
}
export default MovieDetailSection