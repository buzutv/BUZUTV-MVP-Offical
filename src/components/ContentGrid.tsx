import React from 'react';
import MovieCard from '@/components/MovieCard';
import SeriesCard from '@/components/SeriesCard';
import MoreLikeThisCard from './MoreLikeThisCard';

interface ContentGridProps {
  items: any[];
  onCardClick?: (item: any) => boolean;
  isMoreLikeThis?: boolean;
}

const ContentGrid: React.FC<ContentGridProps> = ({ items, onCardClick, isMoreLikeThis = false }) => {
  return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {items.map((item) => (
            <div key={item.id} className="w-full relative aspect-[16/9]">
              <div className="absolute inset-0">
                {isMoreLikeThis ? (
                    <MoreLikeThisCard item={item} />
                ) : item.type === 'series' ? (
                    <SeriesCard series={item} onOpen={() => onCardClick?.(item)} />
                ) : (
                    <MovieCard movie={item} onOpen={() => onCardClick?.(item)} />
                )}
              </div>
            </div>
        ))}
      </div>

  );
};

export default ContentGrid;
