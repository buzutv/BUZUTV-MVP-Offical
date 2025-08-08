import { Movie } from "@/data/mockMovies";
import { Content } from "@/hooks/useContent";

export interface MoreLikeThisOptions {
  currentItem: Movie | Content;
  contentItem?: Content;
  allContent: Content[];
  effectiveKidsMode: boolean;
  skipContentFiltering?: boolean;
}

export interface FilteredRecommendation extends Content {
  posterUrl: string;
}

/**
 * Debug logging for More Like This filtering
 */
const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[MoreLikeThis] ${message}`, data);
  }
};

/**
 * Safely gets poster URL from either Movie or Content item
 */
const getPosterUrl = (item: Movie | Content): string => {
  if ('posterUrl' in item) {
    return item.posterUrl;
  }
  return item.poster_url || "/placeholder.svg";
};

/**
 * Safely gets channel ID from either Movie or Content item
 */
const getChannelId = (item: Movie | Content): string | undefined => {
  if ('channelId' in item) {
    return item.channelId;
  }
  return item.channel_id || undefined;
};

/**
 * Normalize item to consistent format for comparison
 */
const normalizeItem = (item: Movie | Content) => ({
  id: item.id,
  title: item.title,
  type: item.type || "movie",
  genre: item.genre,
  year: item.year,
  rating: item.rating,
  channelId: getChannelId(item),
});

/**
 * Filter and return recommended content for "More Like This" section
 */
export const getMoreLikeThisRecommendations = (
  options: MoreLikeThisOptions
): FilteredRecommendation[] => {
  const {
    currentItem,
    contentItem,
    allContent,
    effectiveKidsMode,
    skipContentFiltering = false
  } = options;

  const normalizedCurrentItem = normalizeItem(currentItem);

  debugLog('Filtering recommendations for:', {
    title: normalizedCurrentItem.title,
    type: normalizedCurrentItem.type,
    genre: normalizedCurrentItem.genre,
    channelId: normalizedCurrentItem.channelId,
    effectiveKidsMode,
    totalContent: allContent.length
  });

  debugLog('All available content:', allContent.map(item => ({
    title: item.title,
    type: item.type,
    genre: item.genre,
    is_kids: item.is_kids
  })));

  // If skipping filtering, just exclude current item
  if (skipContentFiltering) {
    const result = allContent
      .filter((recItem) => recItem.id !== normalizedCurrentItem.id)
      .map((recItem) => ({
        ...recItem,
        posterUrl: getPosterUrl(recItem),
      }));
    
    debugLog('Skipped filtering, returning items:', result.length);
    return result;
  }

  // Filter and prioritize content
  const baseFilteredContent = allContent.filter((recItem) => {
    // 1. Must be different item
    const passesId = recItem.id !== normalizedCurrentItem.id;
    if (!passesId) {
      debugLog(`Filtered out current item: ${recItem.title}`);
      return false;
    }

    // 2. Must match content type (movies show only movies, series show only series)
    const passesType = recItem.type === normalizedCurrentItem.type;
    if (!passesType) {
      debugLog(`Filtered out wrong type: ${recItem.title} (${recItem.type} vs ${normalizedCurrentItem.type})`);
      return false;
    }

    // 3. Handle kids content filtering
    const passesKids = effectiveKidsMode
      ? recItem.is_kids === true // Show only kids content in kids mode
      : !recItem.is_kids; // Exclude kids content in regular mode
    
    if (!passesKids) {
      debugLog(`Filtered out kids content: ${recItem.title} (kids: ${recItem.is_kids}, kidsMode: ${effectiveKidsMode})`);
      return false;
    }

    debugLog(`✅ Passed basic filters: ${recItem.title}`);
    return true;
  });

  // Prioritize by genre first, then channel, then fallback
  const sameGenreItems = baseFilteredContent.filter((recItem) => {
    const currentGenre = normalizedCurrentItem.genre?.toLowerCase().trim();
    const itemGenre = recItem.genre?.toLowerCase().trim();
    
    debugLog(`Genre comparison for ${recItem.title}:`, {
      currentGenre: `"${normalizedCurrentItem.genre}" -> "${currentGenre}"`,
      itemGenre: `"${recItem.genre}" -> "${itemGenre}"`,
      bothExist: !!(currentGenre && itemGenre),
      match: currentGenre === itemGenre
    });
    
    const sameGenre = currentGenre && itemGenre && currentGenre === itemGenre;
    return sameGenre;
  });

  const sameChannelItems = baseFilteredContent.filter((recItem) => {
    const sameChannelFromItem = normalizedCurrentItem.channelId && recItem.channel_id && 
                               recItem.channel_id === normalizedCurrentItem.channelId;
    
    const sameChannelFromContent = contentItem?.channel_id && recItem.channel_id && 
                                  recItem.channel_id === contentItem.channel_id;
    
    return sameChannelFromItem || sameChannelFromContent;
  });

  // Priority: Same genre > Same channel > All filtered content
  let filteredContent: Content[];
  let matchType: string;

  if (sameGenreItems.length > 0) {
    filteredContent = sameGenreItems;
    matchType = "same genre";
  } else if (sameChannelItems.length > 0) {
    filteredContent = sameChannelItems;
    matchType = "same channel";
  } else {
    filteredContent = baseFilteredContent;
    matchType = "same type (fallback)";
  }
  
  debugLog(`Using ${matchType} matching: ${filteredContent.length} items`, {
    sameGenre: sameGenreItems.length,
    sameChannel: sameChannelItems.length,
    totalFiltered: baseFilteredContent.length
  });

  // Transform to include posterUrl
  const result = filteredContent.map((recItem) => ({
    ...recItem,
    posterUrl: getPosterUrl(recItem),
  }));

  debugLog('Final filtered recommendations:', {
    count: result.length,
    titles: result.map(r => r.title)
  });

  return result;
};