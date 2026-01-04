import { supabaseApi } from "./baseApi";
import { Playlist, PlaylistItem } from "../types";

interface GetPlaylistsByUserArgs {
  userId: string;
  playlist_id?: string;
}
export const playlistsSlice = supabaseApi.injectEndpoints({
     endpoints: (builder) => ({
    getPlaylistsByUser: builder.query<Playlist[], string>({
      query: (userId) =>
        `playlists?created_by=eq.${userId}&order=created_at.desc&select=*`,
      providesTags: ['playlists'],
    }),

    getPlaylistById: builder.query<Playlist, string>({
      query: (id) => `playlists?id=eq.${id}&select=*`,
      transformResponse: (res: Playlist[]) => res[0],
      providesTags: (_r, _e, id) => [{ type: 'playlists', id }],
    }),
    getPlaylistsWithItems: builder.query<PlaylistItem[], string>({
      query: (userId) =>
        `playlists?created_by=eq.${userId}&order=created_at.desc&select=*,playlist_items(*,content(*))`,
      providesTags: ['playlists', 'playlistitems', 'Content'],
    }),
     getPlaylistsWithItemsById: builder.query<PlaylistItem[], GetPlaylistsByUserArgs>({
      query: ({ userId, playlist_id }) =>
        `playlists?created_by=eq.${userId}&id=eq.${playlist_id}&order=created_at.desc&select=*,playlist_items(*,content(*))`,
      providesTags: ['playlists', 'playlistitems', 'Content'],
    }),

    createPlaylist: builder.mutation<Playlist, Pick<Playlist, 'title' | 'description' | 'created_by'>>({
      query: (body) => ({
        url: 'playlists',
        method: 'POST',
        body,
        headers: {
          Prefer: 'return=representation',
        },
      }),
      invalidatesTags: ['playlists'],
    }),

    updatePlaylist: builder.mutation<
      Playlist,
      { id: string; data: Partial<Playlist> }
    >({
      query: ({ id, data }) => ({
        url: `playlists?id=eq.${id}`,
        method: 'PATCH',
        body: data,
        headers: {
          Prefer: 'return=representation',
        },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'playlists', id }],
    }),

    deletePlaylist: builder.mutation<void, string>({
      query: (id) => ({
        url: `playlists?id=eq.${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['playlists'],
    }),
  }),



})


export const {
    useGetPlaylistsByUserQuery,
    useLazyGetPlaylistsByUserQuery,
    useGetPlaylistByIdQuery,
    useGetPlaylistsWithItemsQuery,
    useGetPlaylistsWithItemsByIdQuery,
    useLazyGetPlaylistsWithItemsByIdQuery,
    useLazyGetPlaylistByIdQuery,
    useCreatePlaylistMutation,
    useUpdatePlaylistMutation,
    useDeletePlaylistMutation,
} = playlistsSlice;