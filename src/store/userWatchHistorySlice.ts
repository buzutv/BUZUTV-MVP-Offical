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
      invalidatesTags: ['user_watch_history'],
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
      invalidatesTags: (_r, _e, { id }) => [{ type: 'user_watch_history', id }],
    }),

    deleteWatchHistory: builder.mutation<void, number>({
      query: (id) => ({
        url: `user_watch_history?id=eq.${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['user_watch_history'],
    }),
  }),
})


export const {
    useGetUserWatchHistoryQuery,
    useGetWatchHistoryByMovieQuery,
    useGetWatchHistoryByEpisodeQuery,
    useSaveWatchHistoryMutation,
    useUpdateWatchHistoryMutation,
    useDeleteWatchHistoryMutation,
} = userWatchHistorySlice