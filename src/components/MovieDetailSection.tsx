
import { useSelector } from 'react-redux';
import { getOptimizedImageUrl } from '../utils/youtubeUtils';
import { useEffect, useRef, useState } from 'react';
import { useLazyGetContentByIdQuery } from '@/store/contentSlice';
const MovieDetailSection = ({ contents }: { contents: any }) => {
    const contentId = useSelector((state: any) => state.screenPlayer.contentId);
    const [currentMovieState, setCurrentMovieState] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [triggerContentById] = useLazyGetContentByIdQuery();

    useEffect(() => {
        const fetchContentById = async () => {
            if (!contentId) return;
            setIsLoading(true);
            try {
                const { data } = await triggerContentById(contentId);
                if (data) {
                    setCurrentMovieState(data);
                }
            } catch (error) {
                console.error("Error fetching content by ID:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchContentById();
    }, [contentId, triggerContentById]);

    const movie = currentMovieState
        ? (Array.isArray(currentMovieState) ? currentMovieState[0] : currentMovieState)
        : contents;

    // Show loading only if we have no data at all (neither from state nor from props)
    if (isLoading && !movie) {
        return (
            <div className="relative rounded-lg overflow-hidden mb-12 min-h-[300px] min-w-full bg-white/5 animate-pulse">
                <div className="p-8 flex gap-8">
                    <div className="w-48 h-72 bg-white/10 rounded-lg shadow-2xl" />
                    <div className="flex-1 space-y-4">
                        <div className="h-10 bg-white/10 rounded w-1/3" />
                        <div className="flex gap-4">
                            <div className="h-6 bg-white/10 rounded w-16" />
                            <div className="h-6 bg-white/10 rounded w-16" />
                            <div className="h-6 bg-white/10 rounded w-16" />
                        </div>
                        <div className="h-24 bg-white/10 rounded w-3/4" />
                    </div>
                </div>
            </div>
        );
    }

    if (!movie) return null;

    return (
        <div
            className="relative rounded-lg overflow-hidden mb-12 min-h-[300px] min-w-full"
            style={{
                backgroundImage: movie.poster_url || movie.posterUrl
                    ? `linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.95) 100%), url(${movie.poster_url || movie.posterUrl})`
                    : `linear-gradient(135deg, #1e293b 0%, #0f172a 100%)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <div className="p-8 flex gap-8">
                {/* Poster */}
                <div className="flex-shrink-0">
                    <img
                        src={getOptimizedImageUrl(movie.poster_url || movie.posterUrl, 400)}
                        alt={movie.content_title || movie.title}
                        className="w-48 h-72 object-cover rounded-lg shadow-2xl"
                    />
                </div>

                {/* Details */}
                <div className="flex-1 text-white">
                    <h1 className="text-4xl font-bold mb-4">
                        {movie.content_title || movie.title}
                    </h1>

                    <div className="flex items-center gap-4 mb-6 text-sm">
                        {(movie.year) && (
                            <span className="px-3 py-1 bg-white/10 rounded">{movie.year}</span>
                        )}
                        {(movie.genre) && (
                            <span className="px-3 py-1 bg-white/10 rounded">{movie.genre}</span>
                        )}
                        {(movie.type) && (
                            <span className="px-3 py-1 bg-white/10 rounded capitalize">{movie.type}</span>
                        )}
                        {(movie.duration_minutes || movie.duration) && (
                            <span className="px-3 py-1 bg-white/10 rounded">{movie.duration_minutes || movie.duration} min</span>
                        )}
                        {(movie.rating) && (
                            <span className="px-3 py-1 bg-yellow-500/20 rounded">⭐ {movie.rating}</span>
                        )}
                    </div>

                    {(movie.description) && (
                        <p className="text-white/80 text-lg leading-relaxed mb-6 max-w-3xl">
                            {movie.description}
                        </p>
                    )}

                    {(movie.episodes) && (
                        <div className="mt-4">
                            <span className="text-white/60">Episodes: </span>
                            <span className="text-white font-semibold">{movie.episodes}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default MovieDetailSection