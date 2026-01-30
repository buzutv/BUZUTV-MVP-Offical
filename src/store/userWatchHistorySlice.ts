import { supabaseApi } from "./baseApi";
import { UserWatchHistory } from "../types";

export const userWatchHistorySlice = supabaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserWatchHistory: builder.query<UserWatchHistory[], string>({
      query: (userId) =>
        `user_watch_history?user_id=eq.${userId}&order=watched_at.desc&select=*`,
      providesTags: ['user_watch_history'],
    }),

    getWatchHistoryByMovie: builder.query<UserWatchHistory, { userId: string; movieId: string }>({
      query: ({ userId, movieId }) =>
        `user_watch_history?user_id=eq.${userId}&movie_id=eq.${movieId}&select=*`,
      transformResponse: (res: UserWatchHistory[]) => res[0],
      providesTags: (_r, _e, { userId, movieId }) => [
        { type: 'user_watch_history', id: `${userId}-${movieId}` },
      ],
    }),

    getWatchHistoryByEpisode: builder.query<UserWatchHistory, { userId: string; episodeId: string }>({
      query: ({ userId, episodeId }) =>
        `user_watch_history?user_id=eq.${userId}&episode_id=eq.${episodeId}&select=*`,
      transformResponse: (res: UserWatchHistory[]) => res[0],
      providesTags: (_r, _e, { userId, episodeId }) => [
        { type: 'user_watch_history', id: `${userId}-${episodeId}` },
      ],
    }),

    saveWatchHistory: builder.mutation<UserWatchHistory, Partial<UserWatchHistory>>({
      query: (body) => ({
        url: 'user_watch_history',
        method: 'POST',
        body,
        headers: { Prefer: 'return=representation' },
      }),
      invalidatesTags: ['user_watch_history', 'Content', 'seasons', 'episodes', 'playlists', 'playlistitems', 'recommendations'],
    }),

    upsertWatchHistory: builder.mutation<
      UserWatchHistory,
      { userId: string; movieId?: string; episodeId?: string; data: Partial<UserWatchHistory> }
    >({
      async queryFn({ userId, movieId, episodeId, data }, _api, _extraOptions, baseQuery) {
        // Try update first
        const match = episodeId
          ? `user_id=eq.${userId}&episode_id=eq.${episodeId}`
          : `user_id=eq.${userId}&movie_id=eq.${movieId}`;

        const updateResult = await baseQuery({
          url: `user_watch_history?${match}`,
          method: 'PATCH',
          body: data,
          headers: { Prefer: 'return=representation' },
        });

        if (updateResult.error || !updateResult.data || (updateResult.data as any[]).length === 0) {
          // If update failed or nothing found, try insert
          return baseQuery({
            url: 'user_watch_history',
            method: 'POST',
            body: {
              user_id: userId,
              movie_id: movieId || null,
              episode_id: episodeId || null,
              ...data
            },
            headers: { Prefer: 'return=representation' },
          }) as any;
        }

        return { data: (updateResult.data as any[])[0] as UserWatchHistory };
      },
      invalidatesTags: ['user_watch_history', 'Content', 'seasons', 'episodes', 'playlists', 'playlistitems', 'recommendations'],
    }),

    updateWatchHistory: builder.mutation<
      UserWatchHistory,
      { id: number; data: Partial<UserWatchHistory> }
    >({
      query: ({ id, data }) => ({
        url: `user_watch_history?id=eq.${id}`,
        method: 'PATCH',
        body: data,
        headers: { Prefer: 'return=representation' },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'user_watch_history', id },
        'user_watch_history',
        'Content',
        'seasons',
        'episodes',
        'playlists',
        'playlistitems',
        'recommendations'
      ],
    }),

    deleteWatchHistory: builder.mutation<void, number>({
      query: (id) => ({
        url: `user_watch_history?id=eq.${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['user_watch_history', 'Content', 'seasons', 'episodes', 'playlists', 'playlistitems', 'recommendations'],
    }),
  }),
})

export const {
  useGetUserWatchHistoryQuery,
  useGetWatchHistoryByMovieQuery,
  useGetWatchHistoryByEpisodeQuery,
  useSaveWatchHistoryMutation,
  useUpsertWatchHistoryMutation,
  useUpdateWatchHistoryMutation,
  useDeleteWatchHistoryMutation,
} = userWatchHistorySlice;