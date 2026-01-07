import { getOptimizedImageUrl } from '@/utils/youtubeUtils';
import React from 'react';

interface ContentGridItemProps {
    item: any;
    onClick: (item: any) => void;
    showWatchProgress?: boolean;
}

const ContentGridItem: React.FC<ContentGridItemProps> = ({ item, onClick, showWatchProgress = false }) => {
    return (
        <div
            className="group cursor-pointer flex flex-col gap-2 "
            onClick={() => onClick(item)}
        >
            {/* Poster Container */}
            <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-white/5 shadow-md transition-all duration-300 group-hover:shadow-xl group-hover:ring-2 group-hover:ring-white/20">
                <img
                    src={getOptimizedImageUrl(item.backdrop_url || item.poster_url, 400)}
                    alt={item.title || item.content_title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Play Icon Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <svg className="w-6 h-6 text-white fill-current" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                </div>

                {/* Watch Progress Bar */}
                {showWatchProgress && item.watch_percentage > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                        <div
                            className="h-full bg-red-600"
                            style={{ width: `${item.watch_percentage}%` }}
                        />
                    </div>
                )}
            </div>

            {/* Meta Data */}
            <div className="space-y-1">
                <h3 className="text-white font-medium text-sm truncate leading-tight group-hover:text-blue-400 transition-colors">
                    {item.title || item.content_title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-white/50">
                    {item.year && <span>{item.year}</span>}
                    {item.type && (
                        <>
                            <span className="w-1 h-1 rounded-full bg-white/30" />
                            <span className="capitalize">{item.type}</span>
                        </>
                    )}
                    {item.rating && (
                        <>
                            <span className="w-1 h-1 rounded-full bg-white/30" />
                            <span className="text-yellow-500/80">★ {item.rating}</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContentGridItem;
