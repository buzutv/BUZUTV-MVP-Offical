
import { useSelector } from 'react-redux';
import { getOptimizedImageUrl } from '../utils/youtubeUtils';
import { useEffect, useRef, useState } from 'react';
import { useLazyGetContentByIdQuery } from '@/store/contentSlice';
const MovieDetailSection = () => {
    const currentMovie = useSelector((state: any) => state.screenPlayer.contentId);
    const [currentMovieState, setCurrentMovieState] = useState(null);
    const [triggerContentById] = useLazyGetContentByIdQuery()
    const contentIdRef = useRef(currentMovie)
    if (!currentMovie) return null;
    useEffect(() => {
        const fetchContentById = async () => {
            if (!contentIdRef.current) return;
            const { data, error } = await triggerContentById(contentIdRef.current)
            if (data) {
                setCurrentMovieState(data)
            }
        }
        fetchContentById()
    }, [contentIdRef.current])
    console.log("Current Movie Detail", contentIdRef.current)
    return (

        <div
            className="relative rounded-lg overflow-hidden mb-12 min-h-[300px] min-w-full"
            style={{
                backgroundImage: currentMovieState?.poster_url
                    ? `linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.95) 100%), url(${currentMovieState?.poster_url})`
                    : `linear-gradient(135deg, #1e293b 0%, #0f172a 100%)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <div className="p-8 flex gap-8">
                {/* Poster */}
                <div className="flex-shrink-0">
                    <img
                        src={getOptimizedImageUrl(currentMovieState?.poster_url, 400)}
                        alt={currentMovieState?.content_title || currentMovieState?.title}
                        className="w-48 h-72 object-cover rounded-lg shadow-2xl"
                    />
                </div>

                {/* Details */}
                <div className="flex-1 text-white">
                    <h1 className="text-4xl font-bold mb-4">
                        {currentMovieState?.content_title || currentMovieState?.title}
                    </h1>

                    <div className="flex items-center gap-4 mb-6 text-sm">
                        {currentMovieState?.year && (
                            <span className="px-3 py-1 bg-white/10 rounded">{currentMovieState?.year}</span>
                        )}
                        {currentMovieState?.genre && (
                            <span className="px-3 py-1 bg-white/10 rounded">{currentMovieState?.genre}</span>
                        )}
                        {currentMovieState?.type && (
                            <span className="px-3 py-1 bg-white/10 rounded capitalize">{currentMovieState?.type}</span>
                        )}
                        {currentMovieState?.duration_minutes && (
                            <span className="px-3 py-1 bg-white/10 rounded">{currentMovieState?.duration_minutes} min</span>
                        )}
                        {currentMovieState?.rating && (
                            <span className="px-3 py-1 bg-yellow-500/20 rounded">⭐ {currentMovieState?.rating}</span>
                        )}
                    </div>

                    {currentMovieState?.description && (
                        <p className="text-white/80 text-lg leading-relaxed mb-6 max-w-3xl">
                            {currentMovieState.description}
                        </p>
                    )}

                    {currentMovieState?.episodes && (
                        <div className="mt-4">
                            <span className="text-white/60">Episodes: </span>
                            <span className="text-white font-semibold">{currentMovieState?.episodes}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>





    )
}
export default MovieDetailSection