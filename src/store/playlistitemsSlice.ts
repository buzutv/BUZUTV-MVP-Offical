import { supabaseApi } from "./baseApi";
import { PlaylistItem } from "../types";

export const playlistItemsApi = supabaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPlaylistItems: builder.query<PlaylistItem[], string>({
      query: (playlistId) =>
        `playlist_items?playlist_id=eq.${playlistId}&order=position.asc&select=*`,
      providesTags: ['playlistitems'],
    }),

    addToPlaylist: builder.mutation<
      PlaylistItem,
      Pick<PlaylistItem, 'playlist_id' | 'content_id' | 'position'>
    >({
      query: (body) => ({
        url: 'playlist_items',
        method: 'POST',
        body,
        headers: {
          Prefer: 'return=representation',
        },
      }),
      invalidatesTags: ['playlistitems'],
    }),

    updatePlaylistItemPosition: builder.mutation<
      PlaylistItem,
      { id: string; position: number }
    >({
      query: ({ id, position }) => ({
        url: `playlist_items?id=eq.${id}`,
        method: 'PATCH',
        body: { position },
        headers: {
          Prefer: 'return=representation',
        },
      }),
      invalidatesTags: ['playlistitems'],
    }),

    removeFromPlaylist: builder.mutation<void, string>({
      query: (id) => ({
        url: `playlist_items?id=eq.${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['playlistitems'],
    }),
  }),
});

export const {
  useGetPlaylistItemsQuery,
  useAddToPlaylistMutation,
  useUpdatePlaylistItemPositionMutation,
  useRemoveFromPlaylistMutation,
} = playlistItemsApi;
