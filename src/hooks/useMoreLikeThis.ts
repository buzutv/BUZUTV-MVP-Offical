import { useMemo } from 'react';
import { Movie } from "@/data/mockMovies";
import { Content, useContent } from "@/hooks/useContent";
import { getMoreLikeThisRecommendations } from "@/utils/moreLikeThis";

interface UseMoreLikeThisOptions {
  currentItem: Movie | Content;
  contentItem?: Content;
  effectiveKidsMode: boolean;
  limit?: number; // Number of items to return (default: 6)
}

/**
 * Hook that provides unified "More Like This" functionality
 * Automatically fetches all content and filters for recommendations
 */
export const useMoreLikeThis = (options: UseMoreLikeThisOptions) => {
  const { currentItem, contentItem, effectiveKidsMode, limit = 6 } = options;
  const { content: allContent, isLoading } = useContent();

  const recommendations = useMemo(() => {
    if (isLoading || !allContent || allContent.length === 0) {
      return [];
    }


    const filtered = getMoreLikeThisRecommendations({
      currentItem,
      contentItem,
      allContent, // Use ALL content from the hook
      effectiveKidsMode,
      skipContentFiltering: false,
    });

    // Limit results
    const limited = filtered.slice(0, limit);


    return limited;
  }, [currentItem, contentItem, effectiveKidsMode, allContent, isLoading, limit]);

  return {
    recommendations,
    isLoading,
    hasRecommendations: recommendations.length > 0,
  };
};