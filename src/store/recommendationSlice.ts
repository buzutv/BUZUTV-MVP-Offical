import { supabaseApi } from "./baseApi";
import { Recommendation } from "../types";
export const recommendationSlice = supabaseApi.injectEndpoints({
    endpoints: (builder) => ({
    getUserRecommendations: builder.query<
      Recommendation[],
      { userId: string; type?: string }
    >({
      query: ({ userId, type }) => {
        const q = new URLSearchParams({
          select: '*',
          user_id: `eq.${userId}`,
          dismissed: 'eq.false',
          order: 'confidence_score.desc',
        });

        if (type) q.append('recommendation_type', `eq.${type}`);

        return `recommendations?${q.toString()}`;
      },
      providesTags: ['recommendations'],
    }),
    getRecommendationsWtihContentEmbedded: builder.query<
      Recommendation[],
      { userId: string; type?: string }
    >({
      query: ({ userId, type }) =>({
          url: `recommendations?select=*,content:content_id(*)&user_id=eq.${userId}&dismissed=eq.false${type ? `&recommendation_type=eq.${type}` : ''}`,
          method: 'GET',
          providesTags: ['recommendations'],
      })
    }),
    markRecommendationClicked: builder.mutation<
      Recommendation,
      { id: string }
    >({
      query: ({ id }) => ({
        url: `recommendations?id=eq.${id}`,
        method: 'PATCH',
        body: { clicked: true },
        headers: {
          Prefer: 'return=representation',
        },
      }),
      invalidatesTags: ['recommendations'],
    }),

    dismissRecommendation: builder.mutation<
      Recommendation,
      { id: string }
    >({
      query: ({ id }) => ({
        url: `recommendations?id=eq.${id}`,
        method: 'PATCH',
        body: { dismissed: true },
        headers: {
          Prefer: 'return=representation',
        },
      }),
      invalidatesTags: ['recommendations'],
    }),

    createRecommendation: builder.mutation<
      Recommendation,
      Partial<Recommendation>
    >({
      query: (body) => ({
        url: 'recommendations',
        method: 'POST',
        body,
        headers: {
          Prefer: 'return=representation',
        },
      }),
      invalidatesTags: ['recommendations'],
    }),
  }),

})

export const {
    useGetUserRecommendationsQuery,
    useGetRecommendationsWtihContentEmbeddedQuery,
    useLazyGetRecommendationsWtihContentEmbeddedQuery,
    useLazyGetUserRecommendationsQuery,
    useMarkRecommendationClickedMutation,
    useDismissRecommendationMutation,
    useCreateRecommendationMutation,
} = recommendationSlice;