import { supabaseApi } from './baseApi';
import { Episode } from '../types';

export const episodeSlice = supabaseApi.injectEndpoints({

    endpoints: (builder) => ({
    getEpisodesBySeason: builder.query<Episode[], string>({
      query: (seasonId) =>
        `episodes?season_id=eq.${seasonId}&order=episode_number.asc&select=*`,
      providesTags: ['episodes'],
    }),

    getEpisodeById: builder.query<Episode, string>({
      query: (id) => `episodes?id=eq.${id}&select=*`,
      transformResponse: (res: Episode[]) => res[0],
      providesTags: (_r, _e, id) => [{ type: 'episodes', id }],
    }),

    createEpisode: builder.mutation<Episode, Partial<Episode>>({
      query: (body) => ({
        url: 'episodes',
        method: 'POST',
        body,
        headers: {
          Prefer: 'return=representation',
        },
      }),
      invalidatesTags: ['episodes'],
    }),

    updateEpisode: builder.mutation<
      Episode,
      { id: string; data: Partial<Episode> }
    >({
      query: ({ id, data }) => ({
        url: `episodes?id=eq.${id}`,
        method: 'PATCH',
        body: data,
        headers: {
          Prefer: 'return=representation',
        },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'episodes', id }],
    }),

    deleteEpisode: builder.mutation<void, string>({
      query: (id) => ({
        url: `episodes?id=eq.${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['episodes'],
    }),
  }),

})

export const {
  useGetEpisodesBySeasonQuery,
  useGetEpisodeByIdQuery,
  useCreateEpisodeMutation,
  useUpdateEpisodeMutation,
  useDeleteEpisodeMutation,
} = episodeSlice;