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

const Series = () => {
  const { seriesContent, isLoading, content } = useAppContent();
  const [selectedSeries, setSelectedSeries] = useState(null);

  const [activeGenre, setActiveGenre] = useState("all");
  const { favoriteIds, addToFavorites, removeFromFavorites } =
    useUserFavorites();
  const { content: rawContent } = useContent();
  const { channels } = useChannels();


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

  const handleContentRowCardClick = () => {
    return false; // Series page doesn't need login modal for card clicks
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

  const SeriesRow = ({
    title,
    series,
  }: {
    title: string;
    series: typeof seriesContent.all;
  }) => (
    <section className="mb-8 px-4">
      <h2 className="text-2xl mb-4">{title}</h2>
      <Carousel
        opts={{
          align: "start",
          skipSnaps: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-1">
          <div className="flex py-2">
            {series.map((show) => (
              <CarouselItem key={show.id} className="pl-1 basis-auto">
                <div className="w-64">
                  <ContentCard
                    item={show}
                    variant="series"
                    autoDetectKids={true}
                    width="w-64"
                  />
                </div>
              </CarouselItem>
            ))}
          </div>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </section>
  );

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
                            className="relative flex items-center bg-black/40 backdrop-blur-md rounded-lg shadow-lg p-2 group border-2 border-white/10 hover:border-brand-500/50 min-h-[60px] flex-1 cursor-pointer transition-all duration-300"
                            onClick={() => setSelectedSeries(show)}
                          >
                            {/* Ranking Badge */}
                            <div className="absolute -left-6 top-1/2 -translate-y-1/2 z-10">
                              <span className="bg-[#131313] text-white text-base font-bold px-3 py-1 rounded-full border-2 border-brand-500/50 shadow-lg backdrop-blur-sm">
                                #{index + 1}
                              </span>
                            </div>
                            {/* Poster Image */}
                            <img
                              src={getOptimizedImageUrl(show.posterUrl, 400)}
                              alt={show.title}
                              className="w-16 h-20 object-cover rounded-lg mr-3 flex-shrink-0 border-1 border-brand-500/10 shadow-lg"
                            />
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white text-base mb-0.5 line-clamp-1">
                                {show?.title}
                              </h3>
                              <div className="flex items-center space-x-2 text-xs text-gray-300 mb-0.5">
                                <span>{show.year}</span>
                                <span>•</span>
                                <span className="flex items-center">
                                  <span className="text-yellow-400">★</span>{" "}
                                  {show.rating}
                                </span>
                                <span className="inline-block bg-black/60 text-xs text-white px-2 py-0.5 rounded">
                                  {show.genre}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                    {selectedSeries && (
                      <ContentModal
                        isOpen={!!selectedSeries}
                        onClose={(open) => !open && setSelectedSeries(null)}
                        item={selectedSeries}
                        variant="series"
                        autoDetectKids={true}
                        onPlayEpisode={() => { }} // Reverts to modal on player close
                        videoUrl={rawContent.find((i) => i.id === selectedSeries.id)?.video_url}
                        movieId={selectedSeries.id}
                        contentItem={rawContent.find((i) => i.id === selectedSeries.id) as any}
                        channel={channels.find((ch) => ch.id === selectedSeries.channelId) as any}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="mb-4 px-6 pt-8">
                <FilterBar
                  activeGenre={activeGenre}
                  onGenreChange={handleGenreChange}
                  availableGenres={availableSeriesGenres}
                />
              </div>

              {/* Content Sections */}
              <div className="max-w-full sm:pr-6 sm:pl-4 pr-6 md:pl-6">
                {activeGenre === "all" ? (
                  // Show "All" View with Grid Layout (Replacing genre sliders)
                  <>
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
                        title="Recommended"
                        items={seriesContent.recommended.slice(0, 8)}
                        onCardClick={handleContentRowCardClick}
                      />
                    )}

                    {/* Grid Layout for ALL series */}
                    <div className="sm:mt-0 md:mt-8 mb-8 pl-4">
                      <h2 className="text-2xl mb-4">All TV Shows</h2>
                      {seriesContent.all.length > 0 ? (
                        <ContentGrid
                          items={seriesContent.all}
                          onCardClick={handleContentRowCardClick}
                        />
                      ) : (
                        <div className="text-center py-16">
                          <h3 className="text-xl font-bold mb-2">
                            No series found
                          </h3>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  // Show filtered content for specific genre
                  <>
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
                            No series found
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
      </div>
    </ProtectedRoute >
  );
};

export default Series;
