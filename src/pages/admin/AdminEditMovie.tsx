import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';
import MovieForm from '@/components/forms/MovieForm';
import { supabase } from '@/integrations/supabase/client';
import { useCreateSeasonMutation, useUpdateSeasonMutation } from "@/store/seasonSlice";
import { useCreateEpisodeMutation, useUpdateEpisodeMutation } from "@/store/episodeSlice";

// ── Raw DB row shapes (seasons/episodes are not in the generated Supabase types)

interface RawEpisode {
  episode_number: number;
  title: string | null;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  completion_threshold_seconds: number | null;
}

interface RawSeason {
  season_number: number;
  title: string | null;
  episodes: RawEpisode[] | null;
}

// ── Form-level types ──────────────────────────────────────────────────────────

interface EpisodeRow {
  episodeNumber: number;
  title: string;
  description: string;
  videoUrl: string;
  posterUrl: string;
  durationMinutes: string;
  completionThresholdSeconds: number | null;
}

interface SeasonRow {
  seasonNumber: number;
  title: string;
  episodes: EpisodeRow[];
}

interface FormData {
  title: string;
  description: string;
  type: string;
  isKids: boolean;
  genre: string;
  year: string;
  rating: string;
  posterUrl: string;
  backdropUrl: string;
  videoUrl: string;
  durationMinutes: string;
  seasons: string | number | null;
  episodes: string | number | null;
  seasonsData: SeasonRow[];
  isFeatured: boolean;
  isTrending: boolean;
  channelId: string;
  completionThresholdSeconds: number | null;
}

interface MovieRecord {
  id: string;
  title: string;
  description: string | null;
  type: 'movie' | 'series';
  is_kids: boolean | null;
  genre: string | null;
  year: number | null;
  rating: number | null;
  poster_url: string | null;
  backdrop_url: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  seasons: number | null;
  episodes: number | null;
  is_featured: boolean | null;
  is_trending: boolean | null;
  channel_id: string | null;
  completion_threshold_seconds?: number | null;
  seasons_data: string | null;
}

// ── Supabase helper type for tables not in generated types ────────────────────

type UntypedFrom = {
  from: (table: string) => UntypedQuery;
};

type UntypedQuery = {
  select: (query: string) => UntypedQuery;
  eq: (col: string, val: string | number) => UntypedQuery;
  order: (col: string) => UntypedQuery;
  maybeSingle: () => Promise<{ data: Record<string, unknown> | null }>;
  then: Promise<{ data: unknown[] | null }>['then'];
};

// ── Component ─────────────────────────────────────────────────────────────────

const AdminEditMovie = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [movie, setMovie] = useState<MovieRecord | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [seasonsData, setSeasonsData] = useState<SeasonRow[]>([]);
  const navigate = useNavigate();
  const { id } = useParams();

  const [triggerCreateSeason] = useCreateSeasonMutation();
  const [triggerUpdateSeason] = useUpdateSeasonMutation();
  const [triggerCreateEpisode] = useCreateEpisodeMutation();
  const [triggerUpdateEpisode] = useUpdateEpisodeMutation();

  const fetchMovie = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('id', id as string)
        .single();

      if (error) {
        console.error('Error fetching movie:', error);
        toast.error('Failed to load movie');
        navigate('/admin/movies');
        return;
      }

      const record = data as MovieRecord;
      setMovie(record);

      // Load seasons data — prefer seasons_data JSONB blob (manual entry),
      // fall back to relational seasons/episodes tables (bulk import)
      if (record.seasons_data) {
        try {
          setSeasonsData(JSON.parse(record.seasons_data) as SeasonRow[]);
        } catch {
          setSeasonsData([]);
        }
      } else if (record.type === 'series') {
        const db = supabase as unknown as UntypedFrom;
        const result = await (db
          .from('seasons')
          .select('*, episodes(*)')
          .eq('content_id', id as string)
          .order('season_number') as unknown as Promise<{ data: RawSeason[] | null }>);

        const { data: rawSeasons } = result;

        if (rawSeasons) {
          setSeasonsData(
            rawSeasons.map((s: RawSeason) => ({
              seasonNumber: s.season_number,
              title: s.title ?? `Season ${s.season_number}`,
              episodes: (s.episodes ?? [])
                .sort((a: RawEpisode, b: RawEpisode) => a.episode_number - b.episode_number)
                .map((ep: RawEpisode) => ({
                  episodeNumber: ep.episode_number,
                  title: ep.title ?? '',
                  description: ep.description ?? '',
                  videoUrl: ep.video_url ?? '',
                  posterUrl: ep.thumbnail_url ?? '',
                  durationMinutes: ep.duration_minutes != null ? String(ep.duration_minutes) : '',
                  completionThresholdSeconds: ep.completion_threshold_seconds ?? null,
                })),
            }))
          );
        }
      }
    } catch (err) {
      console.error('Error fetching movie:', err);
      toast.error('Failed to load movie');
      navigate('/admin/movies');
    } finally {
      setFetchLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (id) {
      fetchMovie();
    }
  }, [id, fetchMovie]);

  const handleSubmit = async (data: FormData) => {
    setIsLoading(true);
    console.log("Admin edit data", data);
    try {
      const updateData: Record<string, unknown> = {
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
        seasons: data.seasons ? parseInt(data.seasons.toString()) : null,
        episodes: data.episodes ? parseInt(data.episodes.toString()) : null,
        is_featured: data.isFeatured || false,
        is_trending: data.isTrending || false,
        channel_id: data.channelId || null,
        updated_at: new Date().toISOString(),
        completion_threshold_seconds: data.completionThresholdSeconds || null,
      };

      if (data.seasonsData && data.seasonsData.length > 0) {
        updateData.seasons_data = JSON.stringify(data.seasonsData);
      }

      const { error } = await supabase
        .from('content')
        .update(updateData)
        .eq('id', id as string);

      if (error) {
        console.error('Error updating movie:', error);
        toast.error('Failed to update movie');
        return;
      }

      // Sync seasons and episodes to relational tables
      if (data.seasonsData && data.seasonsData.length > 0) {
        const db = supabase as unknown as UntypedFrom;

        for (const season of data.seasonsData) {
          const seasonCheck = await (db
            .from('seasons')
            .select('id')
            .eq('content_id', id as string)
            .eq('season_number', season.seasonNumber)
            .maybeSingle() as Promise<{ data: { id: string } | null }>);

          const existingSeason = seasonCheck.data;
          let seasonId: string | undefined;

          if (existingSeason) {
            seasonId = existingSeason.id;
            await triggerUpdateSeason({
              id: seasonId,
              data: { title: season.title || `Season ${season.seasonNumber}` }
            });
          } else {
            const seasonResult = await triggerCreateSeason({
              season_number: season.seasonNumber,
              title: season.title || `Season ${season.seasonNumber}`,
              content_id: id,
            });

            if (seasonResult.error) {
              console.error('Error adding season:', seasonResult.error);
              continue;
            }

            const createdSeason = Array.isArray(seasonResult.data)
              ? seasonResult.data[0]
              : seasonResult.data;
            seasonId = (createdSeason as { id: string } | null)?.id;
          }

          if (!seasonId) {
            console.error('No season ID found or created');
            continue;
          }

          for (const episode of season.episodes ?? []) {
            const episodeCheck = await (db
              .from('episodes')
              .select('id')
              .eq('season_id', seasonId)
              .eq('episode_number', episode.episodeNumber)
              .maybeSingle() as Promise<{ data: { id: string } | null }>);

            const existingEpisode = episodeCheck.data;

            const episodePayload: Record<string, unknown> = {
              episode_number: episode.episodeNumber,
              title: episode.title,
              season_id: seasonId,
              duration_minutes: episode.durationMinutes
                ? parseInt(episode.durationMinutes.toString())
                : null,
              completion_threshold_seconds: episode.completionThresholdSeconds || null,
            };

            if (episode.description) episodePayload.description = episode.description;
            if (episode.videoUrl) episodePayload.video_url = episode.videoUrl;
            if (episode.posterUrl) episodePayload.thumbnail_url = episode.posterUrl;

            if (existingEpisode) {
              await triggerUpdateEpisode({ id: existingEpisode.id, data: episodePayload });
            } else {
              await triggerCreateEpisode(episodePayload);
            }
          }
        }
      }

      toast.success('Movie updated successfully');
      navigate('/admin/movies');
    } catch (err) {
      console.error('Error updating movie:', err);
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

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            Edit {movie.type === 'series' ? 'Series' : 'Movie'}
          </h2>
          <p className="text-gray-400">
            Update {movie.type === 'series' ? 'series' : 'movie'} information
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <MovieForm
            onSubmit={handleSubmit}
            initialData={{
              title: movie.title,
              description: movie.description ?? '',
              type: movie.type,
              isKids: movie.is_kids ?? false,
              genre: movie.genre ?? '',
              year: movie.year?.toString() ?? '',
              rating: movie.rating?.toString() ?? '',
              posterUrl: movie.poster_url ?? '',
              backdropUrl: movie.backdrop_url ?? '',
              videoUrl: movie.video_url ?? '',
              durationMinutes: movie.duration_minutes?.toString() ?? '',
              seasons: seasonsData,
              isFeatured: movie.is_featured ?? false,
              isTrending: movie.is_trending ?? false,
              channelId: movie.channel_id ?? '',
              completionThresholdSeconds: movie.completion_threshold_seconds ?? 0,
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
