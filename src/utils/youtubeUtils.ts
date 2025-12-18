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

  const { data, error } = await supabase
    .from("user_watch_history")
    .select("*")
    .eq("user_id", userId)
    .eq("movie_id", movieId)
    .single();

  console.log("Watch history data:", data, error);
  if (error) {
    console.error("Error fetching watch history:", error);
    return 0; // Return 0 on error
  }

  if (data) {
    // If 'completed' is true, start from 0. Otherwise, resume from last_position.
    return data;
  }

}


export async function onReadyVideoLoader(e: any, movieId: string, userId: string) {
  const last_position = await fetchWatchHistory(userId, movieId)
  console.log("Last position", last_position.watch_percentage)
  if (last_position.completed || last_position.watch_percentage >= 99) {
    // If movie was completed, reset to beginning
    e.target.seekTo(0, true);
    e.target.playVideo();

    // Mark as not completed since they're watching again
    await supabase
      .from('user_watch_history')
      .upsert({
        completed: false,
        last_position: 0,
        watch_percentage: 0,
        watched_at: new Date().toISOString()
      }, { onConflict: "user_id,movie_id" })
      .eq('user_id', userId)
      .eq('movie_id', movieId);
  } else {
    // If not completed, resume from last position
    console.log("From On Ready Video Loader", movieId)
    e.target.seekTo(last_position.last_position || 0, true);
    e.target.playVideo();
  }
}


export async function saveWatchHistory(userid: string, movieId: string, videoId: string, currentTime: number, completed: boolean, ref) {
  console.log("=== SAVE WATCH HISTORY START ===");
  console.log("Movie Id", movieId);
  console.log("User Id", userid);
  console.log("Current Time", currentTime);

  const watchPercentage = completed ? 100 : Math.floor((currentTime / ref.current.getDuration()) * 100);
  console.log("Watch Percentage", watchPercentage);

  // First, try to UPDATE (this preserves view_counted)
  const { data: updateResult, error: updateError } = await supabase
    .from("user_watch_history")
    .update({
      watched_at: new Date().toISOString(),
      last_position: completed ? 0 : Math.floor(currentTime),
      watch_percentage: watchPercentage,
      completed: completed
      // DON'T touch view_counted - it stays as is!
    })
    .eq("user_id", userid)
    .eq("movie_id", movieId)
    .select();

  // If no rows were updated (doesn't exist), INSERT it
  if (!updateResult || updateResult.length === 0) {
    const { data, error } = await supabase
      .from("user_watch_history")
      .insert({
        user_id: userid,
        movie_id: movieId,
        watched_at: new Date().toISOString(),
        last_position: completed ? 0 : Math.floor(currentTime),
        watch_percentage: watchPercentage,
        completed: completed
        // view_counted defaults to FALSE, trigger will handle it
      })
      .select();
    
    console.log("Insert result:", data);
    console.log("Insert error:", error);
  } else {
    console.log("Update result:", updateResult);
    console.log("Update error:", updateError);
  }

  console.log("=== SAVE WATCH HISTORY END ===");
}


export async function fetchSeriesSeasons(contentUuid: string) {
  const { data, error } = await supabase
    .from("seasons")
    .select("*")
    .eq("content_id", contentUuid)
    .order("season_number", { ascending: true })

  // console.log("Fetched seasons data",data)
  if (error) {
    console.error("Error fetching seasons:", error);
    return [];
  }

  const seasons = data || [];
  for (const season of seasons) {
    const { data: episodesData, error: episodesError } = await supabase
      .from("episodes")
      .select("*")
      .eq("season_id", season.id)
      .order("episode_number", { ascending: true });

    
    if (episodesError) {
      console.error("Error fetching episodes for season", season.id, ":", episodesError);
      season.episodes = [];
    } else {
      season.episodes = episodesData || [];
    }
  }

  return seasons;


}