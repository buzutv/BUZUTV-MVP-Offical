import { supabase } from "../integrations/supabase/client";
// Helper function to convert YouTube URLs to embed format
export const getYouTubeEmbedUrl = (url: string): string | null => {
  if (!url) {
    console.log('No URL provided to getYouTubeEmbedUrl');
    return null;
  }

  console.log('Processing YouTube URL:', url);

  // If it's already an embed URL, return it
  if (url.includes('youtube.com/embed/')) {
    console.log('URL is already an embed URL');
    return url.split('?')[0]; // Remove any existing query parameters
  }

  // Extract video ID from various YouTube URL formats
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);

  if (match && match[2].length === 11) {
    const videoId = match[2];
    console.log('Extracted video ID:', videoId);
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    console.log('Generated embed URL:', embedUrl);
    return embedUrl;
  }

  console.log('Could not extract video ID from URL:', url);
  return null;
};



export const getLastPausedTime = async (movieId: string, userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from("user_watch_history")
      .select("last_position")
      .eq("movie_id", movieId)
      .eq("user_id", userId)
      .order("watched_at", { ascending: false })
      .limit(1);


    if (error) {
      console.error("Error fetching last  paused time:", error);
      return 0;
    }
    if (data && data.length > 0) {
      console.log("Last paused time fetched:", data[0].last_position);
      return data[0].last_position;
    } else {
      console.log("No last paused time found, returning 0");
      return 0;
    }
  } catch (error) {
    console.error("Error fetching last paused time:", error);
    return 0;
  }

}

export async function fetchWatchHistory(userId: string, movieId: string) {
  try {
    const { data, error } = await supabase
      .from("user_watch_history")
      .select("*")
      .eq("user_id", userId)
      .eq("movie_id", movieId)
      .single();
    console.log("Watch history data:", data, movies);
    if (!error && data) {
      // If completed, start from beginning (0), otherwise resume from last position
      return data.last_position; 
    } else {
      // No watch history, start from beginning
      return 0;
    }
  } catch {
    return 0;
    // console.log("No watch history found, starting from beginning");
  }
}