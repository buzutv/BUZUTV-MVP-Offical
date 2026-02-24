
import { useSelector } from 'react-redux';
import { getOptimizedImageUrl } from '../utils/youtubeUtils';
import { useEffect, useRef, useState } from 'react';
import { useLazyGetContentByIdQuery } from '@/store/contentSlice';
const MovieDetailSection = ({ contents }: { contents?: any }) => {
    const selectedVideo = useSelector((state: any) => state.screenPlayer.selectedVideo);
    const contentIdFromRedux = useSelector((state: any) => state.screenPlayer.contentId);

    // Derived item from best available source
    const bestSource = contents || (typeof contentIdFromRedux === 'object' ? contentIdFromRedux : null);
    console.log("Best source", contentIdFromRedux)
    const [currentMovieState, setCurrentMovieState] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [triggerContentById] = useLazyGetContentByIdQuery();

    // Extract ID safely for fetching
    const actualId = bestSource?.id || (typeof contentIdFromRedux === 'string' ? contentIdFromRedux : contentIdFromRedux?.id);

    // Reset external state when the item changes to avoid stale display
    useEffect(() => {
        if (bestSource?.id || actualId) {
            setCurrentMovieState(null);
        }
    }, [bestSource?.id, actualId]);

    useEffect(() => {
        // If we already have a description and title from props/Redux, don't fetch!
        if (bestSource?.description && (bestSource?.title || bestSource?.content_title)) {
            return;
        }

        const fetchContentById = async () => {
            if (!actualId) return;

            setIsLoading(true);
            try {
                // Determine if actualId is string or object (fallback)
                const targetId = typeof actualId === 'string' ? actualId : actualId?.id;
                if (!targetId) return;

                const data = await triggerContentById(targetId).unwrap();
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
    }, [actualId, bestSource?.id, triggerContentById]);

    // Final derived movie object
    const movie = bestSource || (Array.isArray(currentMovieState) ? currentMovieState[0] : currentMovieState);

    // Format duration helper
    const formatDuration = (minutes: number | undefined) => {
        if (!minutes) return null;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        }
        return `${mins}m`;
    };

    // Get display text for duration/seasons
    const getDurationOrSeasonsText = () => {
        if (movie?.type === "series") {
            if (movie.seasons_data) {
                try {
                    const seasonsData = typeof movie.seasons_data === "string"
                        ? JSON.parse(movie.seasons_data)
                        : movie.seasons_data;
                    if (Array.isArray(seasonsData) && seasonsData.length > 0) {
                        const count = seasonsData.length;
                        return count === 1 ? "1 Season" : `${count} Seasons`;
                    }
                } catch (error) {
                    console.error("Error parsing seasons data for duration display:", error);
                }
            }
            if (movie.seasons) {
                const count = Array.isArray(movie.seasons) ? movie.seasons.length : movie.seasons;
                return count === 1 ? "1 Season" : `${count} Seasons`;
            }
            return "Series";
        } else {
            return formatDuration(movie?.duration_minutes || movie?.duration);
        }
    };

    const isKids = movie?.is_kids || movie?.isKids;

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

    const durationOrSeasons = getDurationOrSeasonsText();

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
            <div className="p-8 flex flex-col md:flex-row gap-8">
                {/* Poster */}
                <div className="flex-shrink-0">
                    <img
                        src={getOptimizedImageUrl(movie.poster_url || movie.posterUrl, 400)}
                        alt={movie.content_title || movie.title}
                        className="w-48 h-72 object-cover rounded-lg shadow-2xl border border-white/10"
                    />
                </div>

                {/* Details */}
                <div className="flex-1 text-white">
                    <h1 className="text-4xl font-bold mb-4">
                        {movie.content_title || movie.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-3 mb-6 text-xs md:text-sm font-medium">
                        {/* Rating */}
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-md border border-yellow-500/20">
                            <span className="text-md">★</span>
                            <span className="font-bold">{movie.rating || 0}</span>
                        </div>

                        {/* Year */}
                        {(movie.year) && (
                            <span className="px-3 py-1 bg-white/10 text-white/90 rounded-md border border-white/5">
                                {movie.year}
                            </span>
                        )}

                        {/* Duration / Seasons */}
                        {durationOrSeasons && (
                            <span className="px-3 py-1 bg-white/10 text-white/90 rounded-md border border-white/5">
                                {durationOrSeasons}
                            </span>
                        )}

                        {/* Maturity Rating */}
                        {isKids ? (
                            <span className="px-3 py-1 bg-blue-500/10 border border-blue-400/30 text-blue-400 font-black rounded-md uppercase">
                                KIDS
                            </span>
                        ) : (
                            <span className="px-3 py-1 bg-white/5 border border-white/10 text-white/60 font-black rounded-md uppercase">
                                TV-MA
                            </span>
                        )}

                        {/* Genre */}
                        {(movie.genre) && (
                            <span className="px-3 py-1 bg-brand-500/10 border border-brand-500/20 text-brand-400 font-bold uppercase tracking-wider rounded-md">
                                {movie.genre}
                            </span>
                        )}
                    </div>

                    {(movie.description) && (
                        <p className="text-white/80 text-lg leading-relaxed mb-6 max-w-3xl line-clamp-4">
                            {movie.description}
                        </p>
                    )}

                    {(movie.episodes) && (
                        <div className="mt-4 flex items-center gap-2">
                            <span className="text-white/60 text-sm">Episodes: </span>
                            <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded text-xs">{movie.episodes}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default MovieDetailSection