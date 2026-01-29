
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';
import MovieForm from '@/components/forms/MovieForm';
import { supabase } from '@/integrations/supabase/client';
import { useCreateSeasonMutation, useUpdateSeasonMutation } from "@/store/seasonSlice";
import { useCreateEpisodeMutation, useUpdateEpisodeMutation } from "@/store/episodeSlice";

const AdminEditMovie = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [movie, setMovie] = useState<any>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const navigate = useNavigate();
  const { id } = useParams();

  const [triggerCreateSeason] = useCreateSeasonMutation();
  const [triggerUpdateSeason] = useUpdateSeasonMutation();
  const [triggerCreateEpisode] = useCreateEpisodeMutation();
  const [triggerUpdateEpisode] = useUpdateEpisodeMutation();

  useEffect(() => {
    if (id) {
      fetchMovie();
    }
  }, [id]);

  const fetchMovie = async () => {
    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching movie:', error);
        toast.error('Failed to load movie');
        navigate('/admin/movies');
        return;
      }

      setMovie(data);
    } catch (error) {
      console.error('Error fetching movie:', error);
      toast.error('Failed to load movie');
      navigate('/admin/movies');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    setIsLoading(true);

    try {
      const updateData: any = {
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
        duration_minutes: data.durationMinutes ? parseInt(data.durationMinutes) : null,
        seasons: data.seasons ? parseInt(data.seasons) : null,
        episodes: data.episodes ? parseInt(data.episodes) : null,
        is_featured: data.isFeatured || false,
        is_trending: data.isTrending || false,
        channel_id: data.channelId || null,
        updated_at: new Date().toISOString()
      };

      // Store detailed seasons data in a separate field if needed
      if (data.seasonsData && data.seasonsData.length > 0) {
        updateData.seasons_data = JSON.stringify(data.seasonsData);
      }

      const { error } = await supabase
        .from('content')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating movie:', error);
        toast.error('Failed to update movie');
        return;
      }

      // Sync seasons and episodes
      if (data.seasonsData && data.seasonsData.length > 0) {
        const seasons = data.seasonsData;

        for (let season of seasons) {
          // Check if season exists
          const { data: existingSeason } = await (supabase as any)
            .from('seasons')
            .select('id')
            .eq('content_id', id)
            .eq('season_number', season.seasonNumber)
            .maybeSingle();

          let seasonId;

          if (existingSeason) {
            seasonId = existingSeason.id;
            // Update season title if needed
            await triggerUpdateSeason({
              id: seasonId,
              data: {
                title: season.title || `Season ${season.seasonNumber}`
              }
            });
          } else {
            // Create new season
            const seasonData = await triggerCreateSeason({
              season_number: season.seasonNumber,
              title: season.title || `Season ${season.seasonNumber}`,
              content_id: id,
            });

            if (seasonData.error) {
              console.error('Error adding season:', seasonData.error);
              continue; // Skip episodes if season creation failed
            }

            // Handle response structure
            const createdSeason = Array.isArray(seasonData.data) ? seasonData.data[0] : seasonData.data;
            seasonId = createdSeason?.id;
          }

          if (!seasonId) {
            console.error('No season ID found or created');
            continue;
          }

          const episodes = season.episodes || [];
          for (let episode of episodes) {
            // Check if episode exists
            const { data: existingEpisode } = await (supabase as any)
              .from('episodes')
              .select('id')
              .eq('season_id', seasonId)
              .eq('episode_number', episode.episodeNumber)
              .maybeSingle();

            const episodePayload: any = {
              episode_number: episode.episodeNumber,
              title: episode.title,
              season_id: seasonId,
            };

            // Add optional fields
            if (episode.description) episodePayload.description = episode.description;
            if (episode.videoUrl) episodePayload.video_url = episode.videoUrl;
            if (episode.posterUrl) episodePayload.thumbnail_url = episode.posterUrl;
            // if (episode.airDate) episodePayload.air_date = episode.airDate;
            // if (episode.rating) episodePayload.rating = parseFloat(episode.rating);
            if (episode.completionThresholdSeconds) episodePayload.completion_threshold_seconds = episode.completionThresholdSeconds;

            if (existingEpisode) {
              // Update existing episode
              await triggerUpdateEpisode({
                id: existingEpisode.id,
                data: episodePayload
              });
            } else {
              // Create new episode
              await triggerCreateEpisode(episodePayload);
            }
          }
        }
      }

      toast.success('Movie updated successfully');
      navigate('/admin/movies');
    } catch (error) {
      console.error('Error updating movie:', error);
      toast.error('Failed to update movie');
    } finally {
      setIsLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Loading movie...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!movie) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-white">Movie not found</div>
        </div>
      </AdminLayout>
    );
  }

  // Parse seasons data if it exists
  let seasonsData = [];
  try {
    if (movie.seasons_data) {
      seasonsData = JSON.parse(movie.seasons_data);
    } else if (movie.type === 'series' && movie.seasons) {
      // Fallback: create basic seasons structure
      for (let i = 1; i <= movie.seasons; i++) {
        seasonsData.push({
          seasonNumber: i,
          episodeCount: Math.floor((movie.episodes || 0) / movie.seasons)
        });
      }
    }
  } catch (error) {
    console.error('Error parsing seasons data:', error);
    seasonsData = [];
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Edit {movie.type === 'series' ? 'Series' : 'Movie'}</h2>
          <p className="text-gray-400">Update {movie.type === 'series' ? 'series' : 'movie'} information</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <MovieForm
            onSubmit={handleSubmit}
            initialData={{
              title: movie.title,
              description: movie.description || '',
              type: movie.type,
              isKids: movie.is_kids || false,
              genre: movie.genre || '',
              year: movie.year?.toString() || '',
              rating: movie.rating?.toString() || '',
              posterUrl: movie.poster_url || '',
              backdropUrl: movie.backdrop_url || '',
              videoUrl: movie.video_url || '',
              durationMinutes: movie.duration_minutes?.toString() || '',
              seasons: seasonsData,
              isFeatured: movie.is_featured || false,
              isTrending: movie.is_trending || false,
              channelId: movie.channel_id || ''
            }}
            isLoading={isLoading}
            submitLabel={`Update ${movie.type === 'series' ? 'Series' : 'Movie'}`}
          />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminEditMovie;
