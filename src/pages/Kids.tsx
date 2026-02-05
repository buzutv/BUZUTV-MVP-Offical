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
import { getOptimizedImageUrl } from "@/utils/youtubeUtils";
import { Spinner } from "@/components/ui/spinner";

const Kids = () => {
  const { kidsContent, isLoading } = useAppContent();
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [activeGenre, setActiveGenre] = useState("all");
  const { favoriteIds, addToFavorites, removeFromFavorites } = useUserFavorites();
  const { content } = useContent();
  const { channels } = useChannels();


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

  const handleContentRowCardClick = (item?: any) => {
    if (item) {
      setSelectedMovie(item);
      return true;
    }
    return false;
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
                  180deg,
                  #0F172A 0%,   /* Slate-900 */
                  #1E293B 25%,  /* Slate-800 */
                  #0F172A 100%
                )
              `,
            }}
          ></div>
          <div className="relative flex items-center justify-center min-h-screen">
            <div className="text-2xlold text-white">
              Loading Kids Content
              <Spinner />
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }


  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30">
        <div
          className="fixed inset-0"
          style={{
            background: `
                radial-gradient(circle at top right, rgba(198, 234, 22, 0.15), transparent 400px),
                radial-gradient(circle at bottom left, rgba(146, 243, 20, 0.1), transparent 400px),
                linear-gradient(180deg, #0F172A 0%, #020617 100%)
              `,
          }}
        ></div>
        {/* Navigation is now global, do not render Navbar here */}
        <div className="pt-16">
          {/* Main Layout */}
          {enhancedKidsContent.all.length > 0 ? (
            <>
              {/* Top Section */}
              <div className="max-w-full sm:px-0 md:px-2 pt-4 relative">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:px-0 md:px-4">
                  {/* Left - Hero Banner */}
                  <div className="lg:col-span-2 relative">
                    <HeroBanner
                      movies={enhancedKidsContent.featured}
                      variant="kids"
                    />
                  </div>
                  {/* Right - Top Ranked */}
                  <div className="px-4 pl-6 md:px-0 md:pl-0">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-1 h-8 bg-indigo-500 rounded-full" />
                      <h2 className="text-2xl font-bold text-white tracking-tight">
                        Top Kids Shows
                      </h2>
                    </div>
                    <div
                      className="flex flex-col space-y-3 w-full"
                      style={{ height: "calc(60vh - 2rem)" }}
                    >
                      {enhancedKidsContent.topRanked
                        .slice(0, 5)
                        .map((movie, index) => (
                          <div
                            key={movie.id}
                            className="relative flex items-center bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-2xl p-2 group border border-white/10 hover:border-indigo-500/50 transition-all duration-300 min-h-[85px] h-[calc((60vh-2rem)/5-0.5rem)] cursor-pointer overflow-hidden"
                            onClick={() => handleCardClick(movie)}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/0 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                            {/* Poster Image */}
                            <div className="relative w-[25%] h-full flex-shrink-0 ml-6 mr-4">
                              <img
                                src={getOptimizedImageUrl(movie.posterUrl, 400)}
                                alt={movie.title}
                                className="w-full h-full object-cover rounded-xl border border-white/10 group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute -top-2 -left-2 bg-indigo-500 text-white text-sm font-black w-8 h-8 flex items-center justify-center rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.4)] border-2 border-white/20 group-hover:scale-110 transition-transform z-20">
                                {index + 1}
                              </div>
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0 pr-2">
                              <h3 className="font-bold text-white text-[15px] mb-1 line-clamp-1 group-hover:text-indigo-400 transition-colors">
                                {movie.title}
                              </h3>
                              <div className="flex items-center space-x-3 text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                  <span className="text-yellow-500 font-bold">★</span>
                                  {movie.rating}
                                </span>
                                <span>•</span>
                                <span className="bg-slate-800/80 px-2 py-0.5 rounded text-[10px] font-bold text-indigo-300">
                                  {movie.genre?.split(',')[0]}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                    {selectedMovie && (
                      <ContentModal
                        isOpen={!!selectedMovie}
                        onClose={(open) => !open && setSelectedMovie(null)}
                        item={selectedMovie}
                        variant="auto"
                        isKidsMode={true}
                        onPlayEpisode={() => { }} // Reverts to modal on player close
                        videoUrl={content.find((i) => i.id === selectedMovie.id)?.video_url}
                        movieId={selectedMovie.id}
                        contentItem={content.find((i) => i.id === selectedMovie.id) as any}
                        channel={channels.find((ch) => ch.id === selectedMovie.channelId) as any}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Content Sections */}
              <div className="max-w-full sm:pr-6 sm:pl-4 pr-6 md:pl-6">
                {activeGenre === "all" ? (
                  // Show "All" View with Genre Rows
                  <>
                    {/* Continue Watching for Kids */}
                    {kidsContent.continueWatching?.length > 0 && (
                      <ContentRow
                        title="Continue Watching"
                        items={kidsContent.continueWatching}
                        onCardClick={handleContentRowCardClick}
                      />
                    )}

                    {/* Filter Bar moved below Continue Watching */}
                    <div className="mb-8 px-6 pt-4">
                      <FilterBar
                        activeGenre={activeGenre}
                        onGenreChange={handleGenreChange}
                        availableGenres={availableKidsGenres}
                        variant="kids"
                      />
                    </div>
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

                    {/* Individual Genre Rows for Kids */}
                    {[
                      "Animation", "Family", "Adventure", "Action"
                    ].map(genre => {
                      const genreItems = enhancedKidsContent.byGenre[genre];
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
                        availableGenres={availableKidsGenres}
                        variant="kids"
                      />
                    </div>
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
              <h2 className="text-2xlold mb-4 text-blue-800">
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
    </ProtectedRoute >
  );
};

export default Kids;
