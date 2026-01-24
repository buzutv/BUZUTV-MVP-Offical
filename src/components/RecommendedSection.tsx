import React, { useEffect, useMemo } from "react";
import { useGetRecommendationsWtihContentEmbeddedQuery, useLazyGetRecommendationsWtihContentEmbeddedQuery } from "@/store/recommendationSlice";
import { openScreenPlayer } from "@/store/screenPlayerSlice";
import { useDispatch, useSelector } from "react-redux";
import ContentGridItem from "./ContentGridItem";
import { useAuth } from "@/contexts/AuthContext";
import { useLazyGetSeasonWithEpisodesQuery } from "@/store/seasonSlice";

// Section title helper
const sectionTitles: Record<string, string> = {
  genre_based: "Because you watched similar genres",
  popular: "Trending & Popular",
  history_based: "Pick up where you left off",
  explore: "Explore New Taste",
  default: "Recommended For You",
};

type RecommendedSectionProps = {
  handleRelatedClick: (id: string) => void;
  setMovieid: (id: string) => void;
  setActualVideoUrl: (url: string) => void;
  setMovies: (movies: any[]) => void;
  setVideoEnded: (v: boolean) => void;
  setPlaylists: (v: any[]) => void;
  getOptimizedImageUrl: (url: string | null, size: number) => string;
};

const RecommendedSection: React.FC<RecommendedSectionProps> = ({
  handleRelatedClick,
  setMovieid,
  setActualVideoUrl,
  setMovies,
  setVideoEnded,
  setPlaylists,
  getOptimizedImageUrl,
}) => {
  const { user } = useAuth()
  const [triggerRecommendations, { data, isFetching }] =
    useLazyGetRecommendationsWtihContentEmbeddedQuery();
  const contentId = useSelector((state: any) => state.screenPlayer.contentId);
  const { data: recommendations, refetch } = useGetRecommendationsWtihContentEmbeddedQuery(
    {
      userId: user?.id,
    }, {
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true
  }
  );

  console.log("Recommendations", recommendations)
  const dispatch = useDispatch();

  const [triggerSeasonWithEpisode] = useLazyGetSeasonWithEpisodesQuery()
  const fetchSeriesData = async (content: any) => {
    if (content.type === "series") {
      const data = await triggerSeasonWithEpisode({ contentId: content?.id, userId: user?.id }).unwrap()
      dispatch(openScreenPlayer({
        selectedVideo: content,
        isSeries: true,
        contentId: content?.id,
        seriesData: data, // Dispatch all seasons
        poster_url: content?.poster_url // Include series poster
      }))
    }
    else {
      dispatch(openScreenPlayer({
        selectedVideo: content,
        isSeries: false,
        contentId: content?.id,
      }))
    }
  }

  useEffect(() => {
    triggerRecommendations({
      userId: user?.id,
    });
  }, []);
  const filteredRecommendations = recommendations?.filter((rec: any) => rec.content.id !== contentId);
  // 🔹 Group recommendations by recommendation_type
  const groupedRecommendations = () => {
    if (!data) return {};

    return filteredRecommendations?.reduce((acc: any, rec: any) => {
      const key = rec.recommendation_type || "default";
      if (!acc[key]) acc[key] = [];
      acc[key].push(rec.content);
      return acc;
    }, {}) || {};
  };

  console.log("Recommendations", groupedRecommendations)

  // 🔹 Loading skeleton
  if (isFetching || !data) {
    return (
      <div className="mt-8 mb-8">
        {[1, 2].map((i) => (
          <div key={i} className="mb-10">
            <div className="mb-4 h-8 w-48 rounded-full bg-white/10 animate-pulse" />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j}>
                  <div className="aspect-video rounded-lg bg-white/10 animate-pulse mb-2" />
                  <div className="h-4 w-3/4 bg-white/10 rounded mb-1 animate-pulse" />
                  <div className="h-3 w-1/2 bg-white/5 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 🔹 Render data
  return (
    <div className="mt-8 mb-8">
      {Object.entries(groupedRecommendations).map(([key, recs]: any) => {
        if (!recs.length) return null;

        return (
          <div key={key} className="mb-12">
            <h2 className="mb-6 inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur capitalize">
              {sectionTitles[key] || sectionTitles.default}
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {recs.map((rec: any) => {

                if (!rec) return null;

                return (
                  <ContentGridItem
                    key={rec.id}
                    item={rec}
                    onClick={async (item) => {
                      await fetchSeriesData(item);
                      handleRelatedClick(item.id);
                      setMovieid(item.id);
                      setActualVideoUrl(item.video_url);
                      setMovies([item]);
                      setVideoEnded(false);
                      setPlaylists([]);
                      refetch()
                    }}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RecommendedSection;
