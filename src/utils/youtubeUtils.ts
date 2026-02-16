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
  console.log("Fetching watch history for user:", userId, "movie:", movieId);
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
  console.log("CURRENT MOVIE ID IN EVENT:", movieId);
  // const last_position = await fetchWatchHistory(userId, movieId.id)
  console.log("Last position", movieId.last_position, movieId.watch_percentage, movieId.completed);
  if (movieId.completed || movieId.watch_percentage >= 99) {
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
    e.target.seekTo(movieId?.last_position, true);
    e.target.playVideo();
  }
}


export async function saveWatchHistory(
  userId: string,
  movieId: string,
  episodeId?: string,
  videoId: string,
  currentTime: number,
  completed: boolean,
  ref: any,
  type?: "series" | string,

) {
  const duration = ref.current?.getDuration?.() || 1;
  const current = ref.current?.getCurrentTime?.() || 0;
  const watchPercentage = completed
    ? 100
    : Math.floor((current / duration) * 100);

  console.log("Is Series", episodeId)
  const isSeries = type === "series";

  const payload = {
    user_id: userId,
    movie_id: movieId,
    episode_id: episodeId ? episodeId : null,
    watched_at: new Date().toISOString(),
    last_position: completed ? 0 : Math.floor(currentTime),
    watch_percentage: watchPercentage,
    completed: completed,
  };

  const match = {
    user_id: userId,
    ...(isSeries
      ? episodeId
        ? { episode_id: episodeId }
        : { movie_id: movieId }
      : { movie_id: movieId }),
  };

  // Try update first
  const { data: updated, error: updateError } = await supabase
    .from("user_watch_history")
    .update(payload)
    .match(match)
    .select();

  // If not found → insert
  if (updateError || !updated || updated.length === 0) {
    const { error: insertError } = await supabase
      .from("user_watch_history")
      .insert(payload);

    if (insertError) {
      console.error("Insert failed:", insertError);
    }
  }
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

    // const {data: episodeContentData, error: episodeContentError} = await supabase
    //   .from("content")
    //   .select("*")
    //   .in("video_url", episodesData?.map(ep => ep.video_url));

    // if(episodeContentError) {
    //   console.error("Error fetching episode content data for season", season.id, ":", episodeContentError);
    // }

    const seasonVideoUrls = episodesData?.map(ep => ep.video_url);
    // const {data: episodeContentData, error: episodeContentError} = await supabase
    //   .from("content")
    //   .select("*")
    //   .in("video_url", seasonVideoUrls || []);

    // console.log("Episode content data for season", season.id, ":", episodeContentData, episodeContentError);
    if (episodesError) {
      console.error("Error fetching episodes for season", season.id, ":", episodesError);
      season.episodes = [];
    } else {
      season.episodes = episodesData || [];
    }
  }

  return seasons;
}


// export async function fetchWatchHistory(userId: string, movieId: string) {



// }

export const getOptimizedImageUrl = (
  url: string | null | undefined,
  width: number = 400
): string => {
  if (!url) return '';

  if (!url.includes('supabase.co/storage/v1/object/public/')) {
    return url;
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}width=${width}&quality=80&resize=contain`;
};


export const getRecommendedMovies = async (user_id) => {
  // 1. Fetch recommendations from RPC
  const { data, error } = await supabase.rpc('generate_all_recommendations', {
    user_id_param: user_id
  });

  if (error) {
    console.error("Error fetching recommended movies:", error);
    return {}; // Return empty object on error
  }

  // 2. Fetch details for all items in parallel (Optimization)
  const enrichedMovies = await Promise.all(
    data.map(async (item) => {
      // NOTE: Your JSON shows 'content_id', but your old code used 'rec_content_id'.
      // Ensure you use the correct field name here. I am using 'content_id' based on your JSON.
      const targetId = item.content_id || item.rec_content_id;

      const { data: contentDetails } = await supabase
        .from("content")
        .select("*")
        .eq("id", targetId)
        .single();

      return {
        ...item,
        details: contentDetails
      };
    })
  );

  // 3. Classify (Group) by recommendation_type
  const classifiedMovies = enrichedMovies.reduce((acc, movie) => {
    // Get the type, e.g., "genre_based" or "popular"
    const type = movie.rec_type || 'other';

    // If this category doesn't exist in the accumulator yet, create it
    if (!acc[type]) {
      acc[type] = [];
    }

    // Push the movie into the correct category
    acc[type].push(movie);
    return acc;
  }, {});

  console.log("Classified Recommended Movies", classifiedMovies);
  return classifiedMovies;
};


export const normalizer = (data: any) => {
  /* 
    given data like this
      
    
    transform it into this 
  
  */


  return {
    ...data,
    watch_percentage: data.user_watch_history?.watch_percentage ?? 0,
    last_position: data.user_watch_history?.last_position ?? 0,
    completed: data.user_watch_history?.completed ?? false,
  }






}