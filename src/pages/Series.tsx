import React, { useState } from "react";
import ContentCard from "@/components/ContentCard";
import HeroBanner from "@/components/HeroBanner";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import FilterBar from "@/components/FilterBar";
import ContentRow from "@/components/ContentRow";
import ContentGrid from "@/components/ContentGrid";
import { useAppContent } from "@/hooks/useAppContent";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import ContentModal from "@/components/ContentModal";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import { useContent } from "@/hooks/useContent";
import { useChannels } from "@/hooks/useChannels";
// import FullscreenPlayer from "@/components/FullscreenPlayer";
import { Spinner } from "@/components/ui/spinner";
import { getOptimizedImageUrl } from "@/utils/youtubeUtils";
import { useAuth } from "@/contexts/AuthContext";

const Series = () => {
  const { seriesContent, isLoading, content, continueWatching } = useAppContent();
  const [selectedSeries, setSelectedSeries] = useState(null);

  const [activeGenre, setActiveGenre] = useState("all");
  const { favoriteIds, addToFavorites, removeFromFavorites } =
    useUserFavorites();
  const { content: rawContent } = useContent();
  const { channels } = useChannels();
  const { isLoggedIn, setShowLoginModal } = useAuth();


  console.log("seriesContent", seriesContent)
  // Get genres that actually have series content (excluding kids)
  const availableSeriesGenres = React.useMemo(() => {
    if (!seriesContent.all || seriesContent.all.length === 0) {
      return ["All"];
    }

    const seriesGenres = [
      ...new Set(
        seriesContent.all.map((series) => series.genre).filter(Boolean),
      ),
    ];

    return ["All", ...seriesGenres.sort()];
  }, [seriesContent.all]);

  const handleGenreChange = (genre: string) => {
    setActiveGenre(genre);
  };

  // Get filtered series based on active genre
  const getFilteredSeries = () => {
    if (activeGenre === "all") {
      return seriesContent.all;
    }

    const filtered = seriesContent.all.filter(
      (series) => series.genre.toLowerCase() === activeGenre.toLowerCase(),
    );

    return filtered;
  };

  const filteredSeries = getFilteredSeries();

  const handleContentRowCardClick = (item?: any) => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return true;
    }
    if (item) {
      setSelectedSeries(item);
      return true;
    }
    return false;
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen text-white">
          {/* Fixed background gradient */}
          <div
            className="fixed inset-0"
            style={{
              background: `
                linear-gradient(
                  200deg,
                  #311066 0%,   /* very dark violet */
                  #1D0833 20%,  /* deep blackish purple */
                  #120222 45%,  /* near-black violet */
                  black 100%    /* pure black */
                )`,
            }}
          ></div>
          <div className="relative flex items-center justify-center min-h-screen">
            <div className="text-2xl text-white">
              <Spinner className="w-12 h-12" />
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }



  return (
    <ProtectedRoute>
      {/* Fixed background gradient */}
      <div
        className="fixed inset-0"
        style={{
          background: `
  linear-gradient(
    200deg,
    #311066 0%,   /* very dark violet */
    #1D0833 20%,  /* deep blackish purple */
    #120222 45%,  /* near-black violet */
    black 100%    /* pure black */
`,
        }}
      ></div>

      <div className="relative min-h-screen text-white">
        {/* Removed Navbar */}

        <div className="pt-16">
          {seriesContent.all.length > 0 ? (
            <>
              <div className="max-w-full  sm:px-0 md:px-2 pt-4 relative">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:px-0 md:px-4">
                  <div className="lg:col-span-2 relative">
                    <HeroBanner
                      movies={
                        seriesContent.featured.length > 0
                          ? seriesContent.featured
                          : seriesContent.all.slice(0, 3)
                      }
                    />
                    {/* Bottom gradient transition */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
                      style={{
                        background:
                          "linear-gradient(to bottom right, black 0%, rgba(0,0,0,0.8) 40%, rgba(0,0,0,0.4) 70%, transparent 100%)",
                      }}
                    />
                  </div>

                  <div className="flex flex-col h-full px-4 pl-6 md:px-0 md:pl-0">
                    <h2 className="text-2xl mb-3">Top Ranked Series</h2>
                    <div
                      className="flex flex-col space-y-3 w-full"
                      style={{ height: "calc(60vh - 2rem)" }}
                    >
                      {seriesContent.topRanked
                        .slice(0, 5)
                        .map((show, index) => (
                          <div
                            key={show.id}
                            className="relative flex items-center bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-2xl p-2 group border border-white/10 hover:border-brand-500/50 transition-all duration-300 min-h-[85px] h-[calc((60vh-2rem)/5-0.5rem)] cursor-pointer overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(124,58,237,0.15)] hover:-translate-y-0.5"
                            onClick={() => setSelectedSeries(show)}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-brand-500/0 via-brand-500/0 to-brand-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                            {/* Poster Image with Overlaid Number */}
                            <div className="relative w-[30%] h-full flex-shrink-0 mr-4">
                              <div className="absolute -left-1 bottom-0 z-20 pointer-events-none ">
                                <span className="relative bottom-2 -left-3 text-2xl md:text-3xl font-bold italic p-2 select-none
                                  text-purple-600
                                  drop-shadow-[0_4px_8px_rgba(255,255,255,0.4)]">
                                  {index + 1}
                                </span>
                              </div>
                              <img
                                src={getOptimizedImageUrl(show.posterUrl, 400)}
                                alt={show.title}
                                className="w-full h-full object-cover rounded-xl border border-white/10 group-hover:scale-110 transition-transform duration-500"
                              />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 pr-2">
                              <h3 className="font-bold text-white text-[15px] mb-1 line-clamp-1 group-hover:text-brand-400 transition-colors">
                                {show?.title}
                              </h3>
                              <div className="flex items-center space-x-3 text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                  <span className="text-yellow-500 font-bold">★</span>
                                  {show.rating}
                                </span>
                                <span>•</span>
                                <span className="bg-slate-800/80 px-2 py-0.5 rounded text-[10px] font-bold text-brand-300">
                                  {show.genre?.split(',')[0]}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>

                  </div>
                </div>
              </div>

              {/* --- Content Rows --- */}
              <div className="max-w-full relative pr-6 pl-0 md:pr-8 md:pl-6">
                {seriesContent.continueWatching?.length > 0 && (
                  <ContentRow
                    title="Continue Watching"
                    items={seriesContent.continueWatching}
                    onCardClick={handleContentRowCardClick}
                  />
                )}

                {activeGenre === "all" ? (
                  // Show "All" View with Genre Rows
                  <>
                    {/* Filter Bar moved below Continue Watching */}
                    <div className="mb-8 px-6 pt-4">
                      <FilterBar
                        activeGenre={activeGenre}
                        onGenreChange={handleGenreChange}
                        availableGenres={availableSeriesGenres}
                      />
                    </div>
                    {/* New TV Shows - Sort by created_at (newest first) */}
                    {(() => {
                      const newSeries = seriesContent.all
                        .filter((series) => series.created_at)
                        .sort(
                          (a, b) =>
                            new Date(b.created_at).getTime() -
                            new Date(a.created_at).getTime(),
                        )
                        .slice(0, 8);

                      return (
                        newSeries.length > 0 && (
                          <ContentRow
                            title="New TV Shows"
                            items={newSeries}
                            onCardClick={handleContentRowCardClick}
                          />
                        )
                      );
                    })()}

                    {/* Recommended */}
                    {seriesContent.recommended.length > 0 && (
                      <ContentRow
                        title="Recommended TV Shows"
                        items={seriesContent.recommended.slice(0, 8)}
                        onCardClick={handleContentRowCardClick}
                      />
                    )}

                    {/* Mapped Genre Rows for Series */}
                    {[
                      "Comedy", "Drama", "Sports", "Romance",
                      "Action", "Lifestyle", "Documentary", "Informational"
                    ].map(genre => {
                      const genreItems = seriesContent.byGenre[genre];
                      if (!genreItems || genreItems.length === 0) return null;
                      return (
                        <ContentRow
                          key={genre}
                          title={genre}
                          items={genreItems.slice(0, 8)}
                          onCardClick={handleContentRowCardClick}
                        />
                      );
                    })}
                  </>
                ) : (
                  // Show filtered content for specific genre
                  <>
                    {/* Filter Bar for specific genre view */}
                    <div className="mb-8 px-6 pt-4">
                      <FilterBar
                        activeGenre={activeGenre}
                        onGenreChange={handleGenreChange}
                        availableGenres={availableSeriesGenres}
                      />
                    </div>
                    {filteredSeries.length > 0 && (
                      <>
                        {/* New content row - Sort filtered series by date */}
                        {(() => {
                          const withDates = filteredSeries.filter(
                            (series) => series.created_at,
                          );

                          const newSeriesFiltered = withDates
                            .sort(
                              (a, b) =>
                                new Date(b.created_at).getTime() -
                                new Date(a.created_at).getTime(),
                            )
                            .slice(0, 8);

                          return (
                            newSeriesFiltered.length > 0 && (
                              <ContentRow
                                key={`new-series-${activeGenre}`}
                                title={
                                  activeGenre === "all"
                                    ? "New Content"
                                    : `New ${activeGenre.charAt(0).toUpperCase() + activeGenre.slice(1)} TV Shows`
                                }
                                items={newSeriesFiltered}
                                onCardClick={handleContentRowCardClick}
                              />
                            )
                          );
                        })()}

                        {/* Recommended row */}
                        <ContentRow
                          key={`recommended-series-${activeGenre}`}
                          title={
                            activeGenre === "all"
                              ? "Recommended TV Shows"
                              : `Recommended ${activeGenre.charAt(0).toUpperCase() + activeGenre.slice(1)} TV Shows`
                          }
                          items={filteredSeries.slice(2, 10)}
                          onCardClick={handleContentRowCardClick}
                        />
                      </>
                    )}

                    {/* Grid Layout for all filtered series */}
                    <div className="sm:mt-0 md:mt-8 mb-8 pl-4">
                      <h2 className="text-2xl mb-4">
                        {activeGenre === "all"
                          ? "All Series"
                          : `All ${activeGenre.charAt(0).toUpperCase() + activeGenre.slice(1)} TV Shows`}
                      </h2>

                      {filteredSeries.length > 0 ? (
                        <ContentGrid
                          items={filteredSeries}
                          onCardClick={handleContentRowCardClick}
                        />
                      ) : (
                        <div className="text-center py-16">
                          <h3 className="text-xl font-bold mb-2">
                            No Series Found
                          </h3>
                          <p className="text-gray-400">
                            No {activeGenre} series available at the moment
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <h2 className="text-2xl mb-4">No series available</h2>
              <p className="text-gray-400">
                Series will appear here once they're added to the platform
              </p>
            </div>
          )}
        </div>

        {/* --- Modal --- */}
        {selectedSeries && (
          <ContentModal
            isOpen={!!selectedSeries}
            onClose={() => setSelectedSeries(null)}
            item={selectedSeries}
            variant="series"
            autoDetectKids={true}
            onPlayEpisode={() => { }}
            movieId={selectedSeries.id}
            videoUrl={rawContent.find((i) => i.id === selectedSeries.id)?.video_url}
            contentItem={rawContent.find((i) => i.id === selectedSeries.id) as any}
            channel={channels.find((ch) => ch.id === selectedSeries.channelId) as any}
          />
        )}
      </div>
    </ProtectedRoute >
  );
};

export default Series;
