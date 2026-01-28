
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

    try {
      const contentData: any = {
        title: data.title,
        description: data.description || null,
        type: data.type,
        is_kids: data.isKids || false,
        genre: data.genre || null,
        year: data.year ? parseInt(data.year) : null,
        rating: data.rating ? parseFloat(data.rating) : null,
        poster_url: data.posterUrl || null,
        backdrop_url: data.backdropUrl || null,
        video_url: data.videoUrl || null,
        duration_minutes: data.type === 'movie' && data.durationMinutes ? parseInt(data.durationMinutes) : null,
        seasons: data.type === 'series' && data.seasons ? parseInt(data.seasons) : null,
        episodes: data.type === 'series' && data.episodes ? parseInt(data.episodes) : null,
        is_featured: data.isFeatured || false,
        is_trending: data.isTrending || false,
        channel_id: data.channelId || null,
        completion_threshold_seconds: data.completionThresholdSeconds || null,
      };



      // Store detailed seasons data if provided
      if (data.seasonsData && data.seasonsData.length > 0) {
        const seasons = data.seasonsData
        // for each season create a season using seaons slice withthe content id
        // for each episode with in each season create an episode using episodes slice with the season id
        for (let season of seasons) {
          const seasonData = await triggerCreateSeason({
            season_number: season.season_number,
            title: season.title,
            content_id: contentData.id,
          })


          if (seasonData.error) {
            console.error('Error adding season:', seasonData.error);
            toast.error('Failed to add season');
            return;
          }

          const seasonId = seasonData.data.id;
          const episodes = season.episodes;
          for (let episode of episodes) {
            const episodeData = await triggerCreateEpisode({
              episode_number: episode.episode_number,
              title: episode.title,
              season_id: seasonId,
              ...episode,
            })

            if (episodeData.error) {
              console.error('Error adding episode:', episodeData.error);
              toast.error('Failed to add episode');
              return;
            }
          }
        }

        contentData.seasons_data = JSON.stringify(data.seasonsData);
      }

      const { error } = await supabase
        .from('content')
        .insert([contentData]);

      if (error) {
        console.error('Error adding content:', error);
        toast.error('Failed to add content');
        return;
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
