import { Movie } from "@/data/mockMovies";
import { Content } from "@/hooks/useContent";
import { supabase } from "../integrations/supabase/client";

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


export async function savePauseTime(videoId: string, userId: string, pauseTime: number) {
  const { data, error } = await supabase
    .from("video_pauses") // your table
    .insert([{ video_id: videoId, user_id: userId, paused_at: pauseTime }]);

  if (error) {
    console.error("Error saving pause time:", error);
  } else {
    console.log("Pause time saved:", data);
  }
}


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



  // If skipping filtering, just exclude current item
  if (skipContentFiltering) {
    const result = allContent
      .filter((recItem) => recItem.id !== normalizedCurrentItem.id)
      .map((recItem) => ({
        ...recItem,
        posterUrl: getPosterUrl(recItem),
      }));
    
    return result;
  }

  // Filter and prioritize content
  const baseFilteredContent = allContent.filter((recItem) => {
    // 1. Must be different item
    const passesId = recItem.id !== normalizedCurrentItem.id;
    if (!passesId) {
      return false;
    }

    // 2. Must match content type (movies show only movies, series show only series)
    const passesType = recItem.type === normalizedCurrentItem.type;
    if (!passesType) {
      return false;
    }

    // 3. Handle kids content filtering
    const passesKids = effectiveKidsMode
      ? recItem.is_kids === true // Show only kids content in kids mode
      : !recItem.is_kids; // Exclude kids content in regular mode
    
    if (!passesKids) {
      return false;
    }

    return true;
  });

  // Prioritize by genre first, then channel, then fallback
  const sameGenreItems = baseFilteredContent.filter((recItem) => {
    const currentGenre = normalizedCurrentItem.genre?.toLowerCase().trim();
    const itemGenre = recItem.genre?.toLowerCase().trim();
    
    
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
  

  // Transform to include posterUrl
  const result = filteredContent.map((recItem) => ({
    ...recItem,
    posterUrl: getPosterUrl(recItem),
  }));


  return result;
};