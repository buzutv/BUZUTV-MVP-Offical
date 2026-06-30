import React, { useMemo, useState } from "react";
import ContentRow from "@/components/ContentRow";
import HeroBanner from "@/components/HeroBanner";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import FilterBar from "@/components/FilterBar";
import ContentGrid from "@/components/ContentGrid";
import { useAppContent } from "@/hooks/useAppContent";
import ContentModal from "@/components/ContentModal";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import { useContent } from "@/hooks/useContent";
import { useChannels } from "@/hooks/useChannels";
import FullscreenPlayer from "@/components/FullscreenPlayer";

const Kids = () => {
  const { kidsContent, isLoading } = useAppContent();
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [activeGenre, setActiveGenre] = useState("all");
  const { favoriteIds, addToFavorites, removeFromFavorites } =
    useUserFavorites();
  const { content } = useContent();
  const { channels } = useChannels();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>("");
  const [currentVideoTitle, setCurrentVideoTitle] = useState<string>("");

  // Enhanced kids content with additional categories
  const enhancedKidsContent = useMemo(() => {
    if (!kidsContent.all || kidsContent.all.length === 0)
      return {
        all: [],
        featured: [],
        topRanked: [],
        recommended: [],
        trending: [],
        new: [],
        byGenre: {},
      };

    const kidsMovies = kidsContent.all;

    return {
      all: kidsMovies,
      featured:
        kidsContent.featured.length > 0
          ? kidsContent.featured
          : kidsMovies.slice(0, 5),
      topRanked: kidsMovies.slice(0, 10),
      recommended: kidsMovies.slice(0, 20),
      trending:
        kidsContent.trending.length > 0
          ? kidsContent.trending
          : kidsMovies.slice(0, 8),
      new:
        kidsContent.new.length > 0 ? kidsContent.new : kidsMovies.slice(0, 8),
      byGenre: {
        Animation: kidsMovies.filter((m) =>
          m.genre?.toLowerCase().includes("animation"),
        ),
        Family: kidsMovies.filter((m) =>
          m.genre?.toLowerCase().includes("family"),
        ),
        Adventure: kidsMovies.filter((m) =>
          m.genre?.toLowerCase().includes("adventure"),
        ),
        Action: kidsMovies.filter((m) =>
          m.genre?.toLowerCase().includes("action"),
        ),
      },
    };
  }, [kidsContent]);

  // Get genres that actually have kids content
  const availableKidsGenres = useMemo(() => {
    if (!enhancedKidsContent.all || enhancedKidsContent.all.length === 0) {
      return ["All"];
    }

    const kidsGenres = [
      ...new Set(
        enhancedKidsContent.all.map((item) => item.genre).filter(Boolean),
      ),
    ];

    return ["All", ...kidsGenres.sort()];
  }, [enhancedKidsContent.all]);

  const handleGenreChange = (genre: string) => {
    setActiveGenre(genre);
  };

  // Get filtered kids content based on active genre
  const getFilteredKidsContent = () => {
    if (activeGenre === "all") {
      return enhancedKidsContent.all;
    }
    return enhancedKidsContent.all.filter(
      (item) => item.genre?.toLowerCase() === activeGenre.toLowerCase(),
    );
  };

  const filteredKidsContent = getFilteredKidsContent();

  const handleContentRowCardClick = () => {
    return false; // Kids page doesn't need login modal for card clicks
  };

  // Add click logic for Top Ranked
  const handleCardClick = (movie) => {
    setSelectedMovie(movie);
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
              Loading Kids Content...
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-tl from-yellow-300 via-blue-300 to-sky-400 text-white">
        {/* Navigation is now global, do not render Navbar here */}
        <div className="pt-16">
          {/* Main Layout */}
          {enhancedKidsContent.all.length > 0 ? (
            <>
              {/* Top Section */}
              <div className="max-w-full  sm:px-0 md:px-2 pt-4 relative">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:px-0 md:px-4">
                  {/* Left - Hero Banner */}
                  <div className="lg:col-span-2 relative">
                    <HeroBanner
                      movies={enhancedKidsContent.featured}
                      variant="kids"
                    />
                  </div>
                  {/* Right - Top Ranked */}
                  <div className="px-4 pl-4 md:px-0 md:pl-0">
                    <h2 className="text-2xl mb-3 text-blue-800">
                      Top Kids Shows
                    </h2>
                    <div
                      className="flex flex-col space-y-3 w-full"
                      style={{ height: "calc(60vh - 2rem)" }}
                    >
                      {enhancedKidsContent.topRanked
                        .slice(0, 5)
                        .map((movie, index) => (
                          <div
                            key={movie.id}
                            className="relative flex items-center bg-white/20 backdrop-blur-sm rounded-lg shadow-lg p-2 group border-2 border-transparent hover:border-yellow-400 hover:border-opacity-80 min-h-[60px] h-[calc((60vh-2rem)/5-0.5rem)] cursor-pointer"
                            onClick={() => handleCardClick(movie)}
                          >
                            {/* Ranking Badge */}
                            <div className="absolute -left-4 top-1/2 -translate-y-1/2 z-10">
                              <span className="bg-yellow-500 text-blue-800 text-base font-bold px-3 py-1 rounded-full shadow-lg border-4 border-white">
                                #{index + 1}
                              </span>
                            </div>
                            {/* Poster Image */}
                            <img
                              src={movie.posterUrl}
                              alt={movie.title}
                              className="w-16 h-20 object-cover rounded-lg mr-3 flex-shrink-0 border-2 border-white/50"
                            />
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-blue-800 text-base mb-0.5 line-clamp-1">
                                {movie.title}
                              </h3>
                              <div className="flex items-center space-x-2 text-xs text-blue-700 mb-0.5">
                                <span>{movie.year}</span>
                                <span>•</span>
                                <span className="flex items-center">
                                  <span className="text-yellow-500">★</span>{" "}
                                  {movie.rating}
                                </span>
                              </div>
                              <div className="flex justify-end">
                                <span className="inline-block bg-blue-600/60 text-xs text-white px-2 py-0.5 rounded">
                                  {movie.genre}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                    {selectedMovie &&
                      (() => {
                        // Match MovieCard modal logic
                        const isSaved = favoriteIds.includes(selectedMovie.id);
                        const contentItem = content.find(
                          (item) => item.id === selectedMovie.id,
                        );
                        const videoUrl = contentItem?.video_url;
                        const channel = channels.find(
                          (ch) => ch.id === selectedMovie.channelId,
                        );
                        // This will be handled internally by ContentModal using useMoreLikeThis hook
                        const recommendedContent = [];
                        const handleSaveModal = () => {
                          if (isSaved) {
                            removeFromFavorites(selectedMovie.id);
                          } else {
                            addToFavorites(selectedMovie.id);
                          }
                        };
                        const handleModalPlayClick = () => {
                          if (videoUrl) {
                            setIsFullscreen(true);
                          }
                        };
                        const handleExitFullscreen = () => {
                          setIsFullscreen(false);
                        };
                        return (
                          <>
                            {isFullscreen && currentVideoUrl && (
                              <FullscreenPlayer
                                isOpen={isFullscreen}
                                onClose={() => {
                                  setIsFullscreen(false);
                                  setCurrentVideoUrl("");
                                  setCurrentVideoTitle("");
                                }}
                                videoUrl={currentVideoUrl}
                                title={currentVideoTitle}
                              />
                            )}
                            <ContentModal
                              isOpen={!!selectedMovie && !isFullscreen}
                              onClose={(open) => !open && setSelectedMovie(null)}
                              item={selectedMovie}
                              variant="auto"
                              isKidsMode={true}
                              onPlayEpisode={(url, episodeTitle) => {
                                if (url) {
                                  setCurrentVideoUrl(url);
                                  setCurrentVideoTitle(episodeTitle);
                                  setIsFullscreen(true);
                                }
                              }}
                              videoUrl={videoUrl}
                              contentItem={contentItem}
                              channel={channel}
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
                  availableGenres={availableKidsGenres}
                  variant="kids"
                />
              </div>

              {/* Content Sections */}
              <div className="max-w-full sm:pr-6 sm:pl-4 pr-6 md:pl-6">
                {activeGenre === "all" ? (
                  // Show all kids content rows when "All" is selected
                  <>
                    {/* New Kids */}
                    {enhancedKidsContent.new.length > 0 && (
                      <ContentRow
                        title="New Kids Content"
                        items={enhancedKidsContent.new}
                        onCardClick={handleContentRowCardClick}
                      />
                    )}

                    {/*/!* Continue Watching *!/*/}
                    {/*{enhancedKidsContent.trending.length > 0 && (*/}
                    {/*  <ContentRow*/}
                    {/*    title="Continue Watching"*/}
                    {/*    items={enhancedKidsContent.trending}*/}
                    {/*    onCardClick={handleContentRowCardClick}*/}
                    {/*  />*/}
                    {/*)}*/}

                    {/* Recommended */}
                    {enhancedKidsContent.recommended.length > 0 && (
                      <ContentRow
                        title="Recommended"
                        items={enhancedKidsContent.recommended}
                        onCardClick={handleContentRowCardClick}
                      />
                    )}

                    {/* TV Shows - Filter kids content by series type */}
                    {(() => {
                      const kidsShows = enhancedKidsContent.all.filter(
                        (item) => item.type === "series",
                      );
                      return (
                        kidsShows.length > 0 && (
                          <ContentRow
                            title="TV Shows"
                            items={kidsShows.slice(0, 8)}
                            onCardClick={handleContentRowCardClick}
                          />
                        )
                      );
                    })()}

                    {/* Movies - Filter kids content by movie type */}
                    {(() => {
                      const kidsMovies = enhancedKidsContent.all.filter(
                        (item) => item.type === "movie",
                      );
                      return (
                        kidsMovies.length > 0 && (
                          <ContentRow
                            title="Movies"
                            items={kidsMovies.slice(0, 8)}
                            onCardClick={handleContentRowCardClick}
                          />
                        )
                      );
                    })()}

                    {/* Educational - Filter kids content by Educational genre */}
                    {(() => {
                      const educationalContent = enhancedKidsContent.all.filter(
                        (item) =>
                          item.genre?.toLowerCase().includes("educational"),
                      );
                      return (
                        educationalContent.length > 0 && (
                          <ContentRow
                            title="Educational"
                            items={educationalContent}
                            onCardClick={handleContentRowCardClick}
                          />
                        )
                      );
                    })()}
                  </>
                ) : (
                  // Show filtered content for specific genre
                  <>
                    {filteredKidsContent.length > 0 && (
                      <>
                        {/* New content row - Sort filtered kids content by date */}
                        {(() => {
                          const newKidsContentFiltered = filteredKidsContent
                            .filter((item) => item.created_at)
                            .sort(
                              (a, b) =>
                                new Date(b.created_at).getTime() -
                                new Date(a.created_at).getTime(),
                            )
                            .slice(0, 8);

                          return (
                            newKidsContentFiltered.length > 0 && (
                              <ContentRow
                                key={`new-kids-content-${activeGenre}`}
                                title={
                                  activeGenre === "all"
                                    ? "New Kids Content"
                                    : `New ${activeGenre.charAt(0).toUpperCase() + activeGenre.slice(1)} Kids Content`
                                }
                                items={newKidsContentFiltered}
                                onCardClick={handleContentRowCardClick}
                              />
                            )
                          );
                        })()}

                        {/* Recommended row */}
                        <ContentRow
                          key={`recommended-kids-content-${activeGenre}`}
                          title={
                            activeGenre === "all"
                              ? "Recommended"
                              : `Recommended ${activeGenre.charAt(0).toUpperCase() + activeGenre.slice(1)} Kids Content`
                          }
                          items={filteredKidsContent.slice(2, 10)}
                          onCardClick={handleContentRowCardClick}
                        />
                      </>
                    )}

                    {/* Grid Layout for all filtered kids content */}
                    <div className="sm:mt-0 md:mt-8 pb-4 pl-4">
                      <h2 className="text-2xl mb-4 text-white">
                        {activeGenre === "all"
                          ? "All Kids Content"
                          : `All ${activeGenre.charAt(0).toUpperCase() + activeGenre.slice(1)} Kids Content`}
                      </h2>

                      {filteredKidsContent.length > 0 ? (
                        <ContentGrid
                          items={filteredKidsContent}
                          onCardClick={handleContentRowCardClick}
                        />
                      ) : (
                        <div className="text-center py-16">
                          <h3 className="text-xl font-bold mb-2 text-white">
                            No kids content found
                          </h3>
                          <p className="text-blue-700">
                            No{" "}
                            {activeGenre === "all"
                              ? ""
                              : activeGenre.charAt(0).toUpperCase() +
                                activeGenre.slice(1) +
                                " "}
                            kids content available at the moment
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
              <h2 className="text-2xl mb-4 text-blue-800">
                No Kids Content Available
              </h2>
              <div className="text-6xl mb-4">🎈</div>
              <p className="text-blue-700">
                Fun kids shows and movies will appear here soon!
              </p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Kids;
