import { supabaseApi } from "./baseApi";
import { Season } from "../types";

export const seasonSlice = supabaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSeasonsByContent: builder.query<Season[], string>({
      query: (contentId) =>
        `seasons?content_id=eq.${contentId}&order=season_number.asc&select=*`,
      providesTags: ['seasons'],
    }),

    getSeasonById: builder.query<Season, string>({
      query: (id) => `seasons?id=eq.${id}&select=*`,
      transformResponse: (res: Season[]) => res[0],
      providesTags: (_r, _e, id) => [{ type: 'seasons', id }],
    }),

    getSeasonWithEpisodes: builder.query<Season[], { contentId: string; userId: string }>({
      query: ({ contentId, userId }) =>
        `seasons?content_id=eq.${contentId}&order=season_number.asc&select=*,episodes(*,user_watch_history(*))&episodes.user_watch_history.user_id=eq.${userId}`,
      transformResponse: (res: any[]) =>
        res.map((season) => ({
          ...season,
          episodes: (season.episodes || []).map((ep: any) => {
            const [history] = ep.user_watch_history ?? [];
            return {
              ...ep,
              watch_percentage: history?.watch_percentage ?? 0,
              last_position: history?.last_position ?? 0,
              completed: history?.completed ?? false,
              watched_at: history?.watched_at || null,
              user_watch_history: undefined, // optional cleanup
            };
          }).sort((a: any, b: any) => (a.episode_number || 0) - (b.episode_number || 0)),
        })),

      providesTags: (_r, _e, { contentId }) => [
        { type: "seasons", id: contentId },
      ],
    }),

    getSeasonWithEpisodesSeries: builder.query<any[], { userId: string }>(
      {
        query: ({ userId }) =>
          `seasons?order=season_number.asc&select=*,content!inner(*),episodes(*,user_watch_history(*))&content.type=eq.series&episodes.user_watch_history.user_id=eq.${userId}`,
        transformResponse: (res: any[]) =>
          res.map((season) => ({
            ...season,
            episodes: (season.episodes || [])
              .map((ep: any) => {
                const [history] = ep.user_watch_history ?? [];
                return {
                  ...ep,
                  watch_percentage: history?.watch_percentage ?? 0,
                  last_position: history?.last_position ?? 0,
                  completed: history?.completed ?? false,
                  watched_at: history?.watched_at || null,
                  user_watch_history: history,
                };
              })
              .sort(
                (a: any, b: any) =>
                  (a.episode_number || 0) - (b.episode_number || 0)
              ),
          })),

        providesTags: (_r, _e) => [
          { type: "seasons" },
        ],
      }),

    createSeason: builder.mutation<
      Season,
      Pick<Season, 'content_id' | 'season_number' | 'title' | 'release_date'>
    >({
      query: (body) => ({
        url: 'seasons',
        method: 'POST',
        body,
        headers: {
          Prefer: 'return=representation',
        },
      }),
      invalidatesTags: ['seasons'],
    }),

    updateSeason: builder.mutation<
      Season,
      { id: string; data: Partial<Season> }
    >({
      query: ({ id, data }) => ({
        url: `seasons?id=eq.${id}`,
        method: 'PATCH',
        body: data,
        headers: {
          Prefer: 'return=representation',
        },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'seasons', id }],
    }),

    deleteSeason: builder.mutation<void, string>({
      query: (id) => ({
        url: `seasons?id=eq.${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['seasons'],
    }),
  }),
})

export const {
  useGetSeasonsByContentQuery,
  useGetSeasonByIdQuery,
  useGetSeasonWithEpisodesQuery,
  useGetSeasonWithEpisodesSeriesQuery,
  useLazyGetSeasonWithEpisodesQuery,
  useLazyGetSeasonWithEpisodesSeriesQuery,
  useCreateSeasonMutation,
  useUpdateSeasonMutation,
  useDeleteSeasonMutation,
} = seasonSlice;