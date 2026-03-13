import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocation } from "react-router-dom";
import ContentCard from "@/components/ContentCard";
import usePlaylists from "@/hooks/usePlaylists";

interface ContentRowProps {
  title: string;
  items: any[];
  progressBarClassName?: string;
  onCardClick?: (item: any) => boolean;
  onItemClick?: (movie: any) => void;
  isMoreLikeThis?: boolean;
  onOpenRelatedSeries?: (series: any) => void;
  onOpenRelatedMovie?: (movie: any) => void;
  titleClassName?: string;
}

const ContentRow = React.memo(
  ({
    title,
    items,
    progressBarClassName,
    onCardClick,
    onItemClick,
    isMoreLikeThis = false,
    onOpenRelatedSeries,
    onOpenRelatedMovie,
    titleClassName,
  }: ContentRowProps) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout>();
    const location = useLocation();
    const { playlists } = usePlaylists()


    console.log("Playlists in ContentRow:", items);

    const isContinueWatchingRow = /continue\s*watching/i.test(title) || /continue\s*tv\s*show/i.test(title);
    const shouldShowProgress = isContinueWatchingRow;

    const getProgressPercent = useCallback((item: any) => {
      const history = item?.user_watch_history;

      const latest = Array.isArray(history) && history.length > 0
        ? [...history].sort(
          (a, b) =>
            new Date(b?.watched_at || 0).getTime() -
            new Date(a?.watched_at || 0).getTime(),
        )[0]
        : history && typeof history === "object"
          ? history
          : null;

      const explicitPercent = Number(
        latest?.watch_percentage ?? item?.watch_percentage ?? 0,
      );

      if (explicitPercent > 0) {
        return Math.min(100, explicitPercent);
      }

      const lastPosition = Number(latest?.last_position ?? item?.last_position ?? 0);
      const totalDuration = Number(
        latest?.total_duration ??
        latest?.watch_duration ??
        item?.total_duration ??
        item?.watch_duration ??
        ((item?.duration_minutes || item?.duration || 0) * 60),
      );

      if (lastPosition > 0 && totalDuration > 0) {
        return Math.min(100, Math.max(2, Math.round((lastPosition / totalDuration) * 100)));
      }

      return 0;
    }, []);


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

    if (items.length === 0) return null;

    return (

      <section className="pb-6">
        <div className="px-4 mb-2">
          <h2 className={`text-2xl  ${titleClassName || "text-white"}`}>{title}</h2>
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
            className="flex overflow-x-auto scrollbar-hide"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              overflowY: "hidden",
              willChange: "scroll-position",
            }}
          >
            <div className="flex items-center gap-4 py-2 px-4">
              {items.map((item) => (
                <div key={item.id} >
                  <ContentCard
                    item={item}
                    variant={item?.type ?? "auto"}
                    autoDetectKids={true}
                    isMoreLikeThis={isMoreLikeThis}
                    width="w-96"
                    showProgress={shouldShowProgress}
                    progressPercent={getProgressPercent(item)}
                    progressBarClassName={progressBarClassName}
                    onOpen={onCardClick}
                    onItemClick={onItemClick}
                    playlists={playlists}
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
      prevProps.items.length === nextProps.items.length &&
      prevProps.isMoreLikeThis === nextProps.isMoreLikeThis &&
      prevProps.onCardClick === nextProps.onCardClick &&
      prevProps.onItemClick === nextProps.onItemClick &&
      // Compare actual item IDs to detect content changes
      JSON.stringify(prevProps.items.map((item) => item.id)) ===
      JSON.stringify(nextProps.items.map((item) => item.id))
    );
  },
);

ContentRow.displayName = "ContentRow";

export default ContentRow;
