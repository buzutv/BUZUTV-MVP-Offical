import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import MovieCard from "@/components/MovieCard";
import SeriesCard from "@/components/SeriesCard";
import MovieHoverRow from "@/components/MovieHoverRow";
import MoreLikeThisCard from "./MoreLikeThisCard";

interface HomeRowProps {
  title: string;
  items: any[]; // mixed array
  onCardClick?: () => boolean;
  onItemClick?: (movie: any) => void;
  isMoreLikeThis?: boolean;
  onOpenRelatedSeries?: (series: any) => void;
  onOpenRelatedMovie?: (movie: any) => void;
}

const HomeRow = ({
  title,
  items,
  onCardClick,
  onItemClick,
  isMoreLikeThis = false,
  onOpenRelatedSeries,
  onOpenRelatedMovie,
}: HomeRowProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const canScroll = container.scrollWidth > container.clientWidth;

      if (!canScroll) {
        setCanScrollLeft(false);
        setCanScrollRight(false);
        return;
      }

      const scrollLeft = container.scrollLeft;
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;

      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollability();

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollability);
      window.addEventListener("resize", checkScrollability);

      return () => {
        container.removeEventListener("scroll", checkScrollability);
        window.removeEventListener("resize", checkScrollability);
      };
    }
  }, [items.length]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  if (items.length === 0) return null;

  return (
    <section className="mb-6">
      <div className="px-4 mb-2">
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>

      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all duration-200 backdrop-blur-sm"
            style={{ marginLeft: "-10px" }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {canScrollRight && (
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all duration-200 backdrop-blur-sm"
            style={{ marginRight: "-22px" }}
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        )}

        <div
          ref={scrollContainerRef}
          className="flex space-x-2 overflow-x-auto px-4 scrollbar-hide"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            overflowY: "hidden",
          }}
        >
          <MovieHoverRow className="flex space-x-2">
            {items.map((item) => (
              <div key={item.id} className="flex-shrink-0 w-64">
                {isMoreLikeThis ? (
                  <MoreLikeThisCard
                    item={item}
                    onClick={() => {
                      if (item.type === "series") {
                        onOpenRelatedSeries?.(item);
                      } else {
                        onOpenRelatedMovie?.(item);
                      }
                    }}
                  />
                ) : item.type === "series" ? (
                  <SeriesCard series={item} onOpen={onCardClick} />
                ) : (
                  <MovieCard movie={item} onOpen={onCardClick} />
                )}
              </div>
            ))}
          </MovieHoverRow>
        </div>
      </div>
    </section>
  );
};

export default HomeRow;
