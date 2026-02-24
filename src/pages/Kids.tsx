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
            <div className="text-2xl text-white">
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
      <div className="min-h-screen bg-[#F0F9FF] text-slate-800 selection:bg-pink-200/50 overflow-x-hidden">
        {/* Magical Sky Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {/* Vibrant Daytime Gradient */}
          <div
            className="absolute inset-0 transition-opacity duration-1000"
            style={{
              background: `
                radial-gradient(circle at 10% 20%, rgba(238, 223, 17, 0.92) 0%, transparent 40%),
                radial-gradient(circle at 90% 10%, rgba(238, 223, 17, 0.92) 0%, transparent 50%),
                radial-gradient(circle at 50% 90%, rgba(221, 160, 221, 0.3) 0%, transparent 60%),
                linear-gradient(135deg, #E0F2FE 0%, #F0F9FF 50%, #FAF5FF 100%)
              `,
            }}
          />
          {/* Playful Floating Shapes */}
          <div className="absolute top-[-5%] left-[-5%] w-[45%] h-[45%] bg-pink-300/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-[5%] right-[-5%] w-[40%] h-[40%] bg-blue-300/30 rounded-full blur-[100px] animate-[bounce_15s_infinite]" />
          <div className="absolute top-[30%] right-[10%] w-[25%] h-[25%] bg-yellow-200/20 rounded-full blur-[80px]" />

          {/* Subtle Grid Pattern for Texture */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#3B82F6 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>
        {/* Navigation is now global, do not render Navbar here */}
        <div className="pt-16 relative z-20">
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
                    <div className="flex items-center gap-3 mb-6 align-center">
                      <div className="w-2 h-6 bg-gradient-to-b from-pink-400 to-purple-500 rounded-full shadow-lg shadow-pink-500/30" />
                      <h2 className="text-2xl align-center">
                        Top <span className="inline-flex gap-0.5">
                          <span className="text-red-500">K</span>
                          <span className="text-yellow-400">I</span>
                          <span className="text-green-500">D</span>
                          <span className="text-yellow-400">S</span>
                        </span> Shows
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
                            className="relative flex items-center bg-white/60 hover:bg-white/80 backdrop-blur-xl rounded-[2rem] p-4 group border border-white transition-all duration-500 min-h-[85px] h-[calc((60vh-2rem)/5-0.4rem)] cursor-pointer overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(236,72,153,0.15)]"
                            onClick={() => handleCardClick(movie)}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-pink-100/0 via-pink-100/0 to-pink-100/30 opacity-0 group-hover:opacity-100 transition-opacity" />

                            {/* Poster Image with Overlaid Number */}
                            <div className="relative w-[30%] h-full flex-shrink-0 mr-4">
                              <div className="absolute -left-1 bottom-0 z-20 pointer-events-none ">
                                <span className="relative bottom-2 -left-4 text-3xl md:text-4xl font-black italic p-2 select-none
  text-purple-600
  drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)]">
                                  {index + 1}
                                </span>
                              </div>
                              <img
                                src={getOptimizedImageUrl(movie.posterUrl, 400)}
                                alt={movie.title}
                                className="w-full h-full object-cover rounded-[1.2rem] border border-white/50 group-hover:scale-110 transition-transform duration-500"
                              />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 pr-2">
                              <h3 className="font-black text-slate-800 text-base mb-1 line-clamp-1 group-hover:text-pink-600 transition-colors">
                                {movie.title}
                              </h3>
                              <div className="flex items-center space-x-3 text-xs text-slate-500">
                                <span className="flex items-center gap-1 font-bold text-pink-500">
                                  <span className="text-yellow-400">★</span>
                                  {movie.rating}
                                </span>
                                <span>•</span>
                                <span className="bg-blue-100 px-2 py-0.5 rounded-full text-[10px] font-black text-blue-600 border border-blue-200">
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
                        titleClassName="text-black border-l-4 border-pink-500 pl-3"
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
                        titleClassName="text-black border-l-4 border-pink-500 pl-3"
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
                        titleClassName="text-black border-l-4 border-pink-500 pl-3"
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
                            titleClassName="text-black border-l-4 border-pink-500 pl-3"
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
                            titleClassName="text-black border-l-4 border-pink-500 pl-3"
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
                            titleClassName="text-black border-l-4 border-pink-500 pl-3"
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
                          titleClassName="text-black border-l-4 border-pink-500 pl-3"
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
                        {/* Continue Watching for specific genre */}
                        {(() => {
                          const genreCW = kidsContent.continueWatching?.filter(
                            (item) => item.genre?.toLowerCase() === activeGenre.toLowerCase()
                          );
                          return genreCW && genreCW.length > 0 && (
                            <ContentRow
                              key={`cw-kids-${activeGenre}`}
                              title={`Resume ${activeGenre.charAt(0).toUpperCase() + activeGenre.slice(1)} Adventures`}
                              items={genreCW}
                              onCardClick={handleContentRowCardClick}
                              titleClassName="text-black border-l-4 border-pink-500 pl-3"
                            />
                          );
                        })()}

                        {/* Recommended row */}
                        <ContentRow
                          key={`recommended-kids-content-${activeGenre}`}
                          title={
                            activeGenre === "all"
                              ? "Recommended For You"
                              : `Top ${activeGenre.charAt(0).toUpperCase() + activeGenre.slice(1)} Picks`
                          }
                          items={filteredKidsContent.slice(0, 10)}
                          onCardClick={handleContentRowCardClick}
                          titleClassName="text-black border-l-4 border-pink-500 pl-3"
                        />

                        {/* Educational for specific genre */}
                        {(() => {
                          const genreEdu = filteredKidsContent.filter(
                            (item) => item.genre?.toLowerCase().includes("educational")
                          );
                          return genreEdu.length > 0 && (
                            <ContentRow
                              key={`edu-kids-${activeGenre}`}
                              title={`Learn with ${activeGenre.charAt(0).toUpperCase() + activeGenre.slice(1)}`}
                              items={genreEdu}
                              onCardClick={handleContentRowCardClick}
                              titleClassName="text-black border-l-4 border-pink-500 pl-3"
                            />
                          );
                        })()}

                        {/* New content row */}
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
                                title={`New ${activeGenre.charAt(0).toUpperCase() + activeGenre.slice(1)} Content`}
                                items={newKidsContentFiltered}
                                onCardClick={handleContentRowCardClick}
                                titleClassName="text-black border-l-4 border-pink-500 pl-3"
                              />
                            )
                          );
                        })()}
                      </>
                    )}

                    {/* Grid Layout for all filtered kids content */}
                    <div className="sm:mt-0 md:mt-8 pb-4 pl-4">
                      <h2 className="text-2xl font-black mb-6 text-black tracking-tight border-l-4 border-pink-500 pl-3">
                        {activeGenre === "all"
                          ? "Explore All Magical Stories"
                          : `All ${activeGenre.charAt(0).toUpperCase() + activeGenre.slice(1)} Adventures`}
                      </h2>

                      {filteredKidsContent.length > 0 ? (
                        <ContentGrid
                          items={filteredKidsContent}
                          onCardClick={handleContentRowCardClick}
                        />
                      ) : (
                        <div className="text-center py-16 bg-white/40 backdrop-blur-md rounded-[3rem] border border-white/60 shadow-xl">
                          <div className="text-6xl mb-4 animate-bounce">🎈</div>
                          <h3 className="text-2xl font-black mb-2 text-slate-800">
                            Oops! It's Empty
                          </h3>
                          <p className="text-slate-500 max-w-xs mx-auto">
                            No magical stories here yet. Try another adventure category!
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
    </ProtectedRoute >
  );
};

export default Kids;
