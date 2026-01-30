
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import MovieForm from "@/components/forms/MovieForm";
import { useCreateSeasonMutation } from "@/store/seasonSlice";
import { useCreateEpisodeMutation } from "@/store/episodeSlice";

const AdminAddMovie = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [triggerCreateSeason] = useCreateSeasonMutation()
  const [triggerCreateEpisode] = useCreateEpisodeMutation()
  const handleSubmit = async (data: any) => {
    if (!data.title || !data.type) {
      toast.error("Please fill in required fields");
      return;
    }

    setIsLoading(true);
    const { seasonsData, ...formData } = data;
    try {
      const contentData: any = {
        title: data.title,
        description: data.description || null,
        type: data.type,
        is_kids: data.isKids || false,
        genre: data.genre || null,
        year: data.year ? parseInt(data.year.toString()) : null,
        rating: data.rating ? parseFloat(data.rating.toString()) : null,
        poster_url: data.posterUrl || null,
        backdrop_url: data.backdropUrl || null,
        video_url: data.videoUrl || null,
        duration_minutes: data.durationMinutes ? parseInt(data.durationMinutes.toString()) : null,
        seasons: data.type === 'series' && data.seasons ? parseInt(data.seasons.toString()) : null,
        episodes: data.type === 'series' && data.episodes ? parseInt(data.episodes.toString()) : null,
        is_featured: data.isFeatured || false,
        is_trending: data.isTrending || false,
        channel_id: data.channelId || null,
        completion_threshold_seconds: data.completionThresholdSeconds ? parseInt(data.completionThresholdSeconds.toString()) : null,
      };

      // Store detailed seasons data if provided
      if (data.seasonsData && data.seasonsData.length > 0) {
        contentData.seasons_data = JSON.stringify(data.seasonsData);
      }

      // First, insert the content to get the content_id
      const { data: insertedContent, error } = await supabase
        .from('content')
        .insert([contentData])
        .select()
        .single();

      if (error) {
        console.error('Error adding content:', error);
        toast.error('Failed to add content');
        return;
      }

      // Now create seasons and episodes with the content_id
      if (data.seasonsData && data.seasonsData.length > 0) {
        const seasons = data.seasonsData;
        // for each season create a season using seasons slice with the content id
        // for each episode within each season create an episode using episodes slice with the season id
        for (let season of seasons) {
          const seasonData = await triggerCreateSeason({
            season_number: season.seasonNumber,
            title: season.title || `Season ${season.seasonNumber}`,
            content_id: insertedContent.id,
          });

          console.log('Season creation response:', seasonData);

          if (seasonData.error) {
            console.error('Error adding season:', seasonData.error);
            toast.error('Failed to add season');
            return;
          }

          // The response structure from RTK Query mutations is { data: [...] }
          // and Supabase returns an array, so we need to get the first item
          const createdSeason = Array.isArray(seasonData.data) ? seasonData.data[0] : seasonData.data;
          const seasonId = createdSeason?.id;

          if (!seasonId) {
            console.error('Failed to get season ID from response:', seasonData);
            toast.error('Failed to create season - no ID returned');
            return;
          }
          const episodes = season.episodes || [];

          console.log("episodes", episodes)
          for (let episode of episodes) {
            // Only include fields that exist in the database schema
            const episodePayload: any = {
              episode_number: episode.episodeNumber,
              title: episode.title,
              season_id: seasonId,
              duration_minutes: episode.durationMinutes ? parseInt(episode.durationMinutes) : null,
              completion_threshold_seconds: episode.completionThresholdSeconds ? parseInt(episode.completionThresholdSeconds.toString()) : null,
            };

            // Add optional fields if they exist
            if (episode.description) episodePayload.description = episode.description;
            if (episode.videoUrl) episodePayload.video_url = episode.videoUrl;
            if (episode.posterUrl) episodePayload.thumbnail_url = episode.posterUrl;

            const episodeData = await triggerCreateEpisode(episodePayload);

            if (episodeData.error) {
              console.error('Error adding episode:', episodeData.error);
              toast.error('Failed to add episode');
              return;
            }
          }
        }
      }

      toast.success(`${data.type === 'movie' ? 'Movie' : 'Series'} added successfully!`);
      navigate('/admin/movies');
    } catch (error) {
      console.error('Error adding content:', error);
      toast.error('Failed to add content');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Add New Content</h2>
          <p className="text-gray-400">Add a new movie or series to the platform</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <MovieForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            submitLabel="Add Content"
          />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAddMovie;
