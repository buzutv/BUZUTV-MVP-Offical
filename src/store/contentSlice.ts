import { supabaseApi } from "./baseApi"
import { Content, RelatedContentFilterProps } from '../types'





export const contentSlice = supabaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getContent: builder.query<Content[], { type?: string; channelId?: string }>({
      query: (params) => {
        const q = new URLSearchParams({ select: '*' });

        if (params?.type) q.append('type', `eq.${params.type}`);
        if (params?.channelId) q.append('channel_id', `eq.${params.channelId}`);

        return `content?${q.toString()}`;
      },
      providesTags: ['Content'],
    }),

    getContentById: builder.query<Content, string>({
      query: (id) => `content?id=eq.${id}&select=*`,
      transformResponse: (res: Content[]) => res[0],
      providesTags: (_r, _e, id) => [{ type: 'Content', id }],
    }),
    getContentWithWatchHistory: builder.query<Content[], string>({
      query: (userId) =>
        `content?select=*,user_watch_history(*,movie_id)&user_watch_history.user_id=eq.${userId}`,
      providesTags: ['Content', 'user_watch_history'],
    }),

    getPlaylistContentWithWatchHistory: builder.query<
      Content[],
      { userId: string; contentIds: string[] }
    >({
      query: ({ userId, contentIds }) => {
        const ids = contentIds.join(",");
        return `content?id=in.(${ids})&select=*,user_watch_history(watch_percentage,last_position,completed,movie_id)&user_watch_history.user_id=eq.${userId}`;
      },
    }),
    getContentWithWatchHistoryFilters: builder.query<Content[], RelatedContentFilterProps & {
      userId: string
    }>({
      query: ({ genre, year, type, userId }) => {
        const url = new URLSearchParams({ select: '*,user_watch_history(*,movie_id)', });
        if (genre) {
          url.append('genre', `ilike.%${genre}%`);
        }
        if (year) {
          url.append('year', `eq.${year}`);
        }
        if (type) {
          url.append('type', `eq.${type}`);
        }
        if (userId) {
          url.append('user_watch_history.user_id', `eq.${userId}`);
        }
        return {
          url: `content?${url.toString()}&limit=12`,
          method: 'GET',

        }
      }
    }),

    createContent: builder.mutation<Content, Partial<Content>>({
      query: (body) => ({
        url: 'content',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Content'],
    }),

    updateContent: builder.mutation<
      Content,
      { id: string; data: Partial<Content> }
    >({
      query: ({ id, data }) => ({
        url: `content?id=eq.${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Content', id }],
    }),

    deleteContent: builder.mutation<void, string>({
      query: (id) => ({
        url: `content?id=eq.${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Content'],
    }),
  }),
})



export const {
  useGetContentQuery,
  useGetContentByIdQuery,
  useLazyGetContentByIdQuery,
  useCreateContentMutation,
  useGetContentWithWatchHistoryFiltersQuery,
  useLazyGetContentWithWatchHistoryFiltersQuery,
  useGetContentWithWatchHistoryQuery,
  useLazyGetContentWithWatchHistoryQuery,
  useGetPlaylistContentWithWatchHistoryQuery,
  useLazyGetPlaylistContentWithWatchHistoryQuery
} = contentSlice