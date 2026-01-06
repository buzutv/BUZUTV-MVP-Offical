import React, { useEffect, useMemo } from "react";
import { useGetRecommendationsWtihContentEmbeddedQuery, useLazyGetRecommendationsWtihContentEmbeddedQuery } from "@/store/recommendationSlice";
import { openScreenPlayer } from "@/store/screenPlayerSlice";
import { useDispatch } from "react-redux";

// Section title helper
const sectionTitles: Record<string, string> = {
  genre_based: "Because you watched similar genres",
  popular: "Trending & Popular",
  history_based: "Pick up where you left off",
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
  const [triggerRecommendations, { data, isFetching }] =
    useLazyGetRecommendationsWtihContentEmbeddedQuery();

  const {data:recommendations, error , refetch} = useGetRecommendationsWtihContentEmbeddedQuery(
    {
       userId: "03fa9a91-4281-4bd4-9e60-4da2ba72b0f3",
    },{
      refetchOnFocus:true,
      refetchOnMountOrArgChange:true,
      refetchOnReconnect:true
    }
  )
  const dispatch = useDispatch()
;
  useEffect(() => {
    triggerRecommendations({
      userId: "03fa9a91-4281-4bd4-9e60-4da2ba72b0f3",
    });
  }, []);

  // 🔹 Group recommendations by recommendation_type
  const groupedRecommendations = useMemo(() => {
    if (!data) return {};

    return recommendations.reduce((acc: any, rec: any) => {
      const key = rec.recommendation_type || "default";
      if (!acc[key]) acc[key] = [];
      acc[key].push(rec.content);
      return acc;
    }, {});
  }, [recommendations]);


  console.log("Recommendations Data:", groupedRecommendations);
  // 🔹 Loading skeleton
  if (isFetching || !data) {
    return (
      <div className="mt-8 mb-8">
        {[1, 2].map((i) => (
          <div key={i} className="mb-10">
            <div className="mb-4 h-8 w-48 rounded-full bg-white/10 animate-pulse" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j}>
                  <div className="aspect-square rounded-lg bg-white/10 animate-pulse mb-2" />
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

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {recs.map((rec: any) => {
             
                if (!rec) return null;

                return (
                  <div
                    key={rec.id}
                    className="group cursor-pointer"
                    onClick={() => {
                      handleRelatedClick(rec.id);
                      setMovieid(rec.id);
                      setActualVideoUrl(rec.video_url);
                      setMovies([rec]);
                      setVideoEnded(false);
                      setPlaylists([]);
                      dispatch(openScreenPlayer({
                        selectedVideo:rec,
                        currentVideoIndex:null,
                        playlistInfo:null
                      }))
                    }}
                  >
                    {/* Poster */}
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-white/5">
                      <img
                        src={getOptimizedImageUrl(rec.poster_url, 400)}
                        alt={rec.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Meta */}
                    <div className="mt-3">
                      <div className="text-white font-medium truncate">
                        {rec.title}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-white/60 mt-1">
                        {rec.year && <span>{rec.year}</span>}
                        {rec.genre && (
                          <>
                            <span>•</span>
                            <span className="truncate">{rec.genre}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
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
