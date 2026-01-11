import React from "react";
import ContentCard from "@/components/ContentCard";

interface ContentGridProps {
  items: any[];
  onCardClick?: () => boolean;
  onItemClick?: (item: any) => void;
  isMoreLikeThis?: boolean;
}

const ContentGrid: React.FC<ContentGridProps> = ({
  items,
  onCardClick,
  onItemClick,
  isMoreLikeThis = false,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0">
      {items.map((item) => (
        <div key={item.id} className="w-full relative aspect-[16/9]">
          <div className="absolute inset-0">
            <ContentCard
              item={item}
              variant="auto"
              autoDetectKids={true}
              isMoreLikeThis={isMoreLikeThis}
              // className="w-96 h-96"

              onOpen={onCardClick}
              onItemClick={onItemClick}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ContentGrid;
