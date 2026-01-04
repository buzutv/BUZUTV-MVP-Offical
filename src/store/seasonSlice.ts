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

    getSeasonWithEpisodes: builder.query<Season, string>({
      query: (id) =>
        `seasons?content_id=eq.${id}&order=season_number.asc&select=*,episodes(*)`,
      transformResponse: (res: Season[]) => res[0],
      providesTags: (_r, _e, id) => [{ type: 'seasons', id }],
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
    useLazyGetSeasonWithEpisodesQuery,
    useCreateSeasonMutation,
    useUpdateSeasonMutation,
    useDeleteSeasonMutation,
} = seasonSlice;