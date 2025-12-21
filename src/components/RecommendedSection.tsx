import React from 'react';

// Helper to make section titles look nice
const sectionTitles = {
  genre_based: "Because you watched similar genres",
  popular: "Trending & Popular",
  history_based: "Pick up where you left off",
  default: "Recommended For You"
};

const RecommendedSection = ({ recommended, handleRelatedClick, setMovieid, setActualVideoUrl, setMovies, setVideoEnded, setPlaylists, getOptimizedImageUrl }) => {

  // 1. Loading State (If recommended object is empty or null)
  const isLoading = !recommended || Object.keys(recommended).length === 0;

  if (isLoading) {
    return (
      <div className="mt-8 mb-8">
        {/* Render 2 rows of skeletons to simulate categories */}
        {[1, 2].map((section) => (
          <div key={section} className="mb-10">
             {/* Title Skeleton */}
            <div className="mb-4 h-8 w-48 rounded-full bg-white/10 animate-pulse" />

            {/* Grid Skeleton - Matching new grid layout */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-full">
                  {/* Image part */}
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-white/5 shadow-md mb-2">
                    <div className="h-full w-full animate-pulse bg-gradient-to-br from-white/10 via-white/5 to-white/10" />
                  </div>
                  {/* Text parts below */}
                   <div className="h-4 w-3/4 rounded bg-white/10 animate-pulse mb-2" />
                   <div className="h-3 w-1/2 rounded bg-white/5 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 2. Data State (Loop through the object keys)
  return (
    <div className="mt-8 mb-8">
      {Object.entries(recommended).map(([key, movies]) => {
        // Skip rendering a section if it has no movies
        if (!movies || movies.length === 0) return null;

        return (
          <div key={key} className="mb-12">
            {/* Section Title */}
            <h2 className="mb-6 inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur capitalize shadow-sm">
              {sectionTitles[key] || key.replace('_', ' ')}
            </h2>

            {/* Movie Grid - Using the new grid definition */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {movies.map((rec) => {
                // We rely on rec.details for the actual content info
                const content = rec.details;
                if (!content) return null; // Safety check

                return (
                <div
                  key={content.id}
                  // Added 'group' class here for hover effects on children
                  className="group cursor-pointer w-full"
                  onClick={() => {
                    handleRelatedClick(content.id);
                    setMovieid(content.id);
                    setActualVideoUrl(content.video_url);
                    setMovies([content]);
                    setVideoEnded(false);
                    setPlaylists([]);
                  }}
                >
                  {/* Image Container */}
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-white/5 w-full  h-1/2 relative">
                    <img
                      src={getOptimizedImageUrl(content.poster_url, 400)}
                      alt={content.content_title || content.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    {/* Dark Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        {/* Optional: Add info text inside overlay like the example if desired */}
                         {/* <div className="text-white text-sm font-semibold truncate">
                           {content.content_title || content.title}
                         </div> */}
                      </div>
                    </div>
                  </div>

                  {/* Watch Progress Bar */}
                  <div className="mt-2 h-[0.2rem] bg-white/10 rounded-full overflow-hidden">
                     <div
                       className="h-full bg-red-600 rounded-full"
                       // Use optional chaining and fallback to 0 if watch_percentage is missing
                       style={{ width: `${content?.watch_percentage || 0}%` }}
                     ></div>
                  </div>


                  {/* Bottom Text Info */}
                  <div className="mt-3">
                      <div className="text-white font-medium truncate text-base leading-tight">
                        {content.content_title || content.title}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-white/60 mt-1.5 font-medium">
                        {content.year && <span>{content.year}</span>}
                        {content.genre && (
                          <>
                            <span className="text-white/40">•</span>
                            <span className="truncate">{content.genre}</span>
                          </>
                        )}
                      </div>
                  </div>
                </div>
              )})}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RecommendedSection;