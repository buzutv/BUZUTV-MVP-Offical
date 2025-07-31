import React, { useState } from "react";
import SeriesCard from "@/components/SeriesCard";
import MovieHoverRow from "@/components/MovieHoverRow";
import HeroBanner from "@/components/HeroBanner";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import FilterBar from "@/components/FilterBar";
import HomeRow from "@/components/HomeRow";
import ContentGrid from "@/components/ContentGrid";
import { useAppContent } from "@/hooks/useAppContent";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import SeriesModal from "@/components/SeriesModal";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import { useContent } from "@/hooks/useContent";
import { useChannels } from "@/hooks/useChannels";
import FullscreenPlayer from "@/components/FullscreenPlayer";

const Series = () => {
  const { seriesContent, isLoading, content } = useAppContent();
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenVideoUrl, setFullscreenVideoUrl] = useState("");
  const [fullscreenVideoTitle, setFullscreenVideoTitle] = useState("");
  const [activeGenre, setActiveGenre] = useState("all");
  const { favoriteIds, addToFavorites, removeFromFavorites } =
    useUserFavorites();
  const { content: rawContent } = useContent();
  const { channels } = useChannels();

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

  const handleHomeRowCardClick = () => {
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
            <div className="text-2xl text-white">Loading...</div>
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
          <MovieHoverRow className="flex">
            {series.map((show) => (
              <CarouselItem key={show.id} className="pl-1 basis-auto">
                <div className="w-64">
                  <SeriesCard series={show} />
                </div>
              </CarouselItem>
            ))}
          </MovieHoverRow>
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
              <div className="max-w-full px-2 pt-4 relative">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4">
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

                  <div className="flex flex-col h-full">
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
                              src={show.posterUrl}
                              alt={show.title}
                              className="w-16 h-20 object-cover rounded-lg mr-3 flex-shrink-0 border-1 border-brand-500/10 shadow-lg"
                            />
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white text-base mb-0.5 line-clamp-1">
                                {show.title}
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
                    {selectedSeries &&
                      (() => {
                        // Match SeriesCard modal logic
                        const isSaved = favoriteIds.includes(selectedSeries.id);
                        const contentItem = rawContent.find(
                          (item) => item.id === selectedSeries.id,
                        );
                        const videoUrl = contentItem?.video_url;
                        const channel = channels.find(
                          (ch) => ch.id === selectedSeries.channelId,
                        );

                        const recommendedContent = rawContent
                          .filter((item) => {
                            const passesId = item.id !== selectedSeries.id;
                            // If current series is kids content, show only kids content in recommendations
                            // If current series is not kids content, exclude kids content from recommendations
                            const passesKids =
                              selectedSeries.is_kids || contentItem?.is_kids
                                ? item.is_kids === true // Show only kids content
                                : !item.is_kids; // Exclude kids content
                            const passesGenre =
                              item.genre === selectedSeries.genre ||
                              item.channel_id === selectedSeries.channelId;

                            return passesId && passesKids && passesGenre;
                          })
                          .slice(0, 6);
                        const handleSaveModal = () => {
                          if (isSaved) {
                            removeFromFavorites(selectedSeries.id);
                          } else {
                            addToFavorites(selectedSeries.id);
                          }
                        };
                        const handlePlayEpisode = (
                          videoUrl: string,
                          episodeTitle: string,
                        ) => {
                          setFullscreenVideoUrl(videoUrl);
                          setFullscreenVideoTitle(episodeTitle);
                          setIsFullscreen(true);
                        };
                        const handleExitFullscreen = () => {
                          setIsFullscreen(false);
                          setFullscreenVideoUrl("");
                          setFullscreenVideoTitle("");
                        };
                        return (
                          <>
                            {isFullscreen && fullscreenVideoUrl && (
                              <FullscreenPlayer
                                isOpen={isFullscreen}
                                onClose={handleExitFullscreen}
                                videoUrl={fullscreenVideoUrl}
                                title={fullscreenVideoTitle}
                              />
                            )}
                            <SeriesModal
                              isOpen={!!selectedSeries && !isFullscreen}
                              onClose={() => setSelectedSeries(null)}
                              series={selectedSeries}
                              isSaved={isSaved}
                              onSave={handleSaveModal}
                              onPlayEpisode={handlePlayEpisode}
                              videoUrl={videoUrl}
                              contentItem={contentItem}
                              channel={channel}
                              recommendedContent={recommendedContent}
                            />
                          </>
                        );
                      })()}
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
              <div className="max-w-full px-6">
                {activeGenre === "all" ? (
                  // Show all series rows when "All" is selected
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
                          <HomeRow
                            title="New TV Shows"
                            items={newSeries}
                            onCardClick={handleHomeRowCardClick}
                          />
                        )
                      );
                    })()}

                    {/*/!* Continue Watching - Show trending series *!/*/}
                    {/*{seriesContent.trending.length > 0 && (*/}
                    {/*  <HomeRow*/}
                    {/*    title="Continue Watching"*/}
                    {/*    items={seriesContent.trending.slice(0, 8)}*/}
                    {/*    onCardClick={handleHomeRowCardClick}*/}
                    {/*  />*/}
                    {/*)}*/}

                    {/* Recommended */}
                    {seriesContent.recommended.length > 0 && (
                      <HomeRow
                        title="Recommended"
                        items={seriesContent.recommended.slice(0, 8)}
                        onCardClick={handleHomeRowCardClick}
                      />
                    )}

                    {/* Comedy */}
                    {seriesContent.byGenre.Comedy &&
                      seriesContent.byGenre.Comedy.length > 0 && (
                        <HomeRow
                          title="Comedy"
                          items={seriesContent.byGenre.Comedy.slice(0, 8)}
                          onCardClick={handleHomeRowCardClick}
                        />
                      )}

                    {/* Drama */}
                    {seriesContent.byGenre.Drama &&
                      seriesContent.byGenre.Drama.length > 0 && (
                        <HomeRow
                          title="Drama"
                          items={seriesContent.byGenre.Drama.slice(0, 8)}
                          onCardClick={handleHomeRowCardClick}
                        />
                      )}

                    {/* Sports */}
                    {seriesContent.byGenre.Sports &&
                      seriesContent.byGenre.Sports.length > 0 && (
                        <HomeRow
                          title="Sports"
                          items={seriesContent.byGenre.Sports.slice(0, 8)}
                          onCardClick={handleHomeRowCardClick}
                        />
                      )}

                    {/* Romance */}
                    {seriesContent.byGenre.Romance &&
                      seriesContent.byGenre.Romance.length > 0 && (
                        <HomeRow
                          title="Romance"
                          items={seriesContent.byGenre.Romance.slice(0, 8)}
                          onCardClick={handleHomeRowCardClick}
                        />
                      )}

                    {/* Action */}
                    {seriesContent.byGenre.Action &&
                      seriesContent.byGenre.Action.length > 0 && (
                        <HomeRow
                          title="Action"
                          items={seriesContent.byGenre.Action.slice(0, 8)}
                          onCardClick={handleHomeRowCardClick}
                        />
                      )}

                    {/* Lifestyle */}
                    {seriesContent.byGenre.Lifestyle &&
                      seriesContent.byGenre.Lifestyle.length > 0 && (
                        <HomeRow
                          title="Lifestyle"
                          items={seriesContent.byGenre.Lifestyle.slice(0, 8)}
                          onCardClick={handleHomeRowCardClick}
                        />
                      )}

                    {/* Documentary */}
                    {seriesContent.byGenre.Documentary &&
                      seriesContent.byGenre.Documentary.length > 0 && (
                        <HomeRow
                          title="Documentary"
                          items={seriesContent.byGenre.Documentary.slice(0, 8)}
                          onCardClick={handleHomeRowCardClick}
                        />
                      )}

                    {/* Informational */}
                    {seriesContent.byGenre.Informational &&
                      seriesContent.byGenre.Informational.length > 0 && (
                        <HomeRow
                          title="Informational"
                          items={seriesContent.byGenre.Informational.slice(
                            0,
                            8,
                          )}
                          onCardClick={handleHomeRowCardClick}
                        />
                      )}
                  </>
                ) : (
                  // Show filtered content for specific genre
                  <>
                    {filteredSeries.length > 0 && (
                      <>
                        {/* New content row - Sort filtered series by date */}
                        {(() => {
                          console.log("🆕 NEW SERIES ROW DEBUG:");
                          console.log(
                            "Filtered series count:",
                            filteredSeries.length,
                          );
                          console.log(
                            "Active genre for new series:",
                            activeGenre,
                          );

                          const withDates = filteredSeries.filter(
                            (series) => series.created_at,
                          );
                          console.log(
                            "Series with created_at:",
                            withDates.length,
                          );

                          const newSeriesFiltered = withDates
                            .sort(
                              (a, b) =>
                                new Date(b.created_at).getTime() -
                                new Date(a.created_at).getTime(),
                            )
                            .slice(0, 8);

                          console.log(
                            "Final new series for display:",
                            newSeriesFiltered.map((s) => ({
                              title: s.title,
                              genre: s.genre,
                              created_at: s.created_at,
                            })),
                          );

                          return (
                            newSeriesFiltered.length > 0 && (
                              <HomeRow
                                key={`new-series-${activeGenre}`}
                                title={
                                  activeGenre === "all"
                                    ? "New Content"
                                    : `New ${activeGenre.charAt(0).toUpperCase() + activeGenre.slice(1)} TV Shows`
                                }
                                items={newSeriesFiltered}
                                onCardClick={handleHomeRowCardClick}
                              />
                            )
                          );
                        })()}

                        {/* Recommended row */}
                        <HomeRow
                          key={`recommended-series-${activeGenre}`}
                          title={
                            activeGenre === "all"
                              ? "Recommended TV Shows"
                              : `Recommended ${activeGenre.charAt(0).toUpperCase() + activeGenre.slice(1)} TV Shows`
                          }
                          items={filteredSeries.slice(2, 10)}
                          onCardClick={handleHomeRowCardClick}
                        />
                      </>
                    )}

                    {/* Grid Layout for all filtered series */}
                    {/* Grid Layout for all filtered series */}
                    <div className="mt-8 mb-8 pl-4">
                      <h2 className="text-2xl mb-4">
                        {activeGenre === "all"
                          ? "All Series"
                          : `All ${activeGenre.charAt(0).toUpperCase() + activeGenre.slice(1)} TV Shows`}
                      </h2>

                      {filteredSeries.length > 0 ? (
                        <ContentGrid
                          items={filteredSeries}
                          onCardClick={handleHomeRowCardClick}
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
    </ProtectedRoute>
  );
};

export default Series;
