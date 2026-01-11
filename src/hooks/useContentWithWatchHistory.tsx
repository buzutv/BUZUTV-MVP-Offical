import { useEffect, useState, useMemo } from "react";
import { useLazyGetPlaylistContentWithWatchHistoryQuery } from "@/store/contentSlice";

const USER_ID = "03fa9a91-4281-4bd4-9e60-4da2ba72b0f3";

/**
 * Hook to enrich content items with watch history data
 * Similar to how PlaylistDetail fetches watch history
 */
export const useContentWithWatchHistory = (content: any[]) => {
  const [enrichedContent, setEnrichedContent] = useState<any[]>([]);
  const [triggerGetContentWithWatchHistory] = useLazyGetPlaylistContentWithWatchHistoryQuery();

  useEffect(() => {
    async function loadWatchHistory() {
      if (content.length === 0) {
        setEnrichedContent([]);
        return;
      }

      try {
        const data = await triggerGetContentWithWatchHistory({
          userId: USER_ID,
          contentIds: content.map(item => item.id)
        }).unwrap();

        // Normalize watch history data
        const normalized = data?.map((item) => {
          const [history] = item.user_watch_history ?? [];
          return {
            ...item,
            watch_percentage: history?.watch_percentage ?? 0,
            last_position: history?.last_position ?? 0,
            completed: history?.completed ?? false,
            user_watch_history: history ? [history] : []
          };
        }) || [];

        // Merge with original content to preserve any additional fields
        const merged = content.map((item) => {
          const enriched = normalized.find(n => n.id === item.id);
          if (enriched) {
            return {
              ...item,
              watch_percentage: enriched.watch_percentage,
              last_position: enriched.last_position,
              completed: enriched.completed,
              user_watch_history: enriched.user_watch_history
            };
          }
          return {
            ...item,
            watch_percentage: 0,
            last_position: 0,
            completed: false,
            user_watch_history: []
          };
        });

        setEnrichedContent(merged);
      } catch (error) {
        console.error("Error loading watch history:", error);
        // Fallback to original content without watch history
        setEnrichedContent(content.map(item => ({
          ...item,
          watch_percentage: 0,
          last_position: 0,
          completed: false,
          user_watch_history: []
        })));
      }
    }

    loadWatchHistory();
  }, [content, triggerGetContentWithWatchHistory]);

  return enrichedContent;
};
