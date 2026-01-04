import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';



export const supabaseApi = createApi({
  reducerPath: 'supabaseApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`,
    prepareHeaders: (headers) => {
      headers.set('apikey', import.meta.env.VITE_SUPABASE_ANON_KEY);
      headers.set('Authorization', `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`);
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Content', 'Channels','episodes','playlists','playlistitems','profiles','recommendation_settings','recommendations','seasons','user_favourites','user_subscriptions','user_watch_history'],
  endpoints: () => ({}),
});
