import React from "react";
import ContentCard from "@/components/ContentCard";

interface ContentGridProps {
  items: any[];
  onCardClick?: (item: any) => boolean;
  isMoreLikeThis?: boolean;
}

const ContentGrid: React.FC<ContentGridProps> = ({
  items,
  onCardClick,
  isMoreLikeThis = false,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
      {items.map((item) => (
        <div key={item.id} className="w-full relative aspect-[16/9]">
          <div className="absolute inset-0">
            <ContentCard
              item={item}
              variant="auto"
              autoDetectKids={true}
              isMoreLikeThis={isMoreLikeThis}
              onOpen={() => onCardClick?.(item)}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ContentGrid;
