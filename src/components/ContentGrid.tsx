import React from "react";
import ContentCard from "@/components/ContentCard";
import { Skeleton } from "@/components/ui/skeleton";

interface ContentGridProps {
  items: any[];
  isLoading?: boolean;
  onCardClick?: (item: any) => boolean;
  isMoreLikeThis?: boolean;
}

const ContentGrid: React.FC<ContentGridProps> = ({
  items,
  isLoading = false,
  onCardClick,
  isMoreLikeThis = false,
}) => {
  if (isLoading) {
    return (
      <div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2"
        aria-busy="true"
        aria-label="Loading content"
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="w-full aspect-[2/3] sm:aspect-video bg-white/10 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
      {items.map((item) => (
        <div key={item.id} className="w-full">
          <ContentCard
            item={item}
            variant="auto"
            autoDetectKids={true}
            isMoreLikeThis={isMoreLikeThis}
            onOpen={() => onCardClick?.(item)}
          />
        </div>
      ))}
    </div>
  );
};

export default ContentGrid;
