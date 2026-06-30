import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import ContentCard from "@/components/ContentCard";
import { Skeleton } from "@/components/ui/skeleton";

interface ContentRowProps {
  title: string;
  items: any[];
  isLoading?: boolean;
  seeAllPath?: string;
  onCardClick?: () => boolean;
  onItemClick?: (movie: any) => void;
  isMoreLikeThis?: boolean;
  onOpenRelatedSeries?: (series: any) => void;
  onOpenRelatedMovie?: (movie: any) => void;
}

const ContentRow = React.memo(
  ({
    title,
    items,
    isLoading = false,
    seeAllPath,
    onCardClick,
    onItemClick,
    isMoreLikeThis = false,
    onOpenRelatedSeries,
    onOpenRelatedMovie,
  }: ContentRowProps) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout>();

    const checkScrollability = useCallback(() => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
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
      }, 100);
    }, []);

    useEffect(() => {
      checkScrollability();

      const container = scrollContainerRef.current;
      if (container) {
        container.addEventListener("scroll", checkScrollability, {
          passive: true,
        });
        window.addEventListener("resize", checkScrollability, {
          passive: true,
        });

        return () => {
          container.removeEventListener("scroll", checkScrollability);
          window.removeEventListener("resize", checkScrollability);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
      }
    }, [items.length, checkScrollability]);

    const scrollLeft = useCallback(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollBy({ left: -320, behavior: "smooth" });
      }
    }, []);

    const scrollRight = useCallback(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollBy({ left: 320, behavior: "smooth" });
      }
    }, []);

    if (isLoading) {
      return (
        <section className="pb-6" aria-busy="true" aria-label={`Loading ${title}`}>
          <div className="px-4 mb-2">
            <Skeleton className="h-7 w-40 bg-white/10 rounded" />
          </div>
          <div className="flex space-x-2 px-4 py-2 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-64">
                <Skeleton className="w-64 aspect-[2/3] sm:aspect-video bg-white/10 rounded-lg" />
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (items.length === 0) return null;

    return (
      <section className="pb-6">
        <div className="px-4 mb-2 flex items-center justify-between">
          <h2 className="text-2xl">{title}</h2>
          {seeAllPath && (
            <Link
              to={seeAllPath}
              className="text-brand-500 text-sm font-medium hover:text-brand-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
              aria-label={`See all ${title}`}
            >
              See all
            </Link>
          )}
        </div>

        <div className="relative">
          {canScrollLeft && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                scrollLeft();
              }}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all duration-200 backdrop-blur-sm shadow-lg hover:scale-110"
              aria-label={`Scroll ${title} left`}
              style={{ marginLeft: "-10px" }}
            >
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </button>
          )}

          {canScrollRight && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                scrollRight();
              }}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all duration-200 backdrop-blur-sm shadow-lg hover:scale-110"
              aria-label={`Scroll ${title} right`}
              style={{ marginRight: "-22px" }}
            >
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </button>
          )}

          <div
            ref={scrollContainerRef}
            className="flex space-x-2 overflow-x-auto px-4 scrollbar-hide"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              overflowY: "hidden",
              willChange: "scroll-position",
            }}
          >
            <div className="flex space-x-2 py-2">
              {items.map((item) => (
                <div key={item.id} className="flex-shrink-0 w-64">
                  <ContentCard
                    item={item}
                    variant="auto"
                    autoDetectKids={true}
                    isMoreLikeThis={isMoreLikeThis}
                    width="w-64"
                    onOpen={onCardClick}
                    onItemClick={onItemClick}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.title === nextProps.title &&
      prevProps.isLoading === nextProps.isLoading &&
      prevProps.seeAllPath === nextProps.seeAllPath &&
      prevProps.items.length === nextProps.items.length &&
      prevProps.isMoreLikeThis === nextProps.isMoreLikeThis &&
      // Compare actual item IDs to detect content changes
      JSON.stringify(prevProps.items.map((item) => item.id)) ===
        JSON.stringify(nextProps.items.map((item) => item.id))
    );
  },
);

ContentRow.displayName = "ContentRow";

export default ContentRow;
