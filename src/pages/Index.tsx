import React, { useCallback, useMemo, useState } from "react";
import ChannelModal from "@/components/ChannelModal";
import FullViewportHero from "@/components/FullViewportHero";
import FilterBar from "@/components/FilterBar";
import ContentGrid from "@/components/ContentGrid";
import { useAppContent } from "@/hooks/useAppContent";
import { useUserSubscriptions } from "@/hooks/useUserSubscriptions";
import { useAuth } from "@/contexts/AuthContext";
import HomeRow from "@/components/HomeRow";
import { featuredContentIds } from "@/data/featuredContentIds";

const Index = React.memo(() => {
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [activeGenre, setActiveGenre] = useState("all");

  const startTime = performance.now();
  const { homeContent, channels, isLoading, content, kidsContent } =
    useAppContent();

  const availableGenresWithContent = useMemo(() => {
    if (!content.allContent || content.allContent.length === 0) {
      return ["All"];
    }

    const contentGenres = [
      ...new Set(
        content.allContent
          .filter((item) => !item.isKids)
          .map((item) => item.genre)
          .filter(Boolean),
      ),
    ];

    return ["All", ...contentGenres.sort()];
  }, [content.allContent]);

  const { subscriptionIds, toggleSubscription } = useUserSubscriptions();
  const { isLoggedIn, setShowLoginModal } = useAuth();

  const featured = useMemo(
    () =>
      featuredContentIds
        .map((id) => content.allContent.find((item) => item.id === id))
        .filter(Boolean),
    [content.allContent],
  );

  const handleChannelClick = useCallback(
    (channel: any) => {
      if (!isLoggedIn) {
        setShowLoginModal(true);
        return;
      }
      setSelectedChannel(channel);
      setShowChannelModal(true);
    },
    [isLoggedIn, setShowLoginModal],
  );

  const handleCloseChannelModal = useCallback(() => {
    setShowChannelModal(false);
    setSelectedChannel(null);
  }, []);

  const handleHomeRowCardClick = useCallback(() => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return true;
    }
    return false;
  }, [isLoggedIn, setShowLoginModal]);

  const handleGenreChange = useCallback((genre: string) => {
    setActiveGenre(genre);
  }, []);

  const filteredContent = useMemo(() => {
    if (activeGenre === "all") {
      return content.allContent.filter((item) => !item.isKids);
    }
    return content.allContent.filter(
      (item) =>
        item.genre.toLowerCase() === activeGenre.toLowerCase() && !item.isKids,
    );
  }, [content.allContent, activeGenre]);

  if (isLoading) {
    console.log("🏠 [Index] Still loading...");
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  console.log("🏠 [Index] Rendering complete, data loaded:", {
    homeContentCount: homeContent.trending?.length || 0,
    channelsCount: channels?.length || 0,
    contentCount: content.allContent?.length || 0,
    renderTime: performance.now() - startTime,
  });

  return (
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
`,
        }}
      ></div>

      <div className="relative">
        {/* Channel Modal */}
        <ChannelModal
          isOpen={showChannelModal}
          onClose={handleCloseChannelModal}
          channel={selectedChannel}
        />

        {/* Full Viewport Hero Section with Channels at Bottom */}
        <FullViewportHero
          items={featured}
          allContent={content.allContent}
          channels={channels}
          onChannelClick={handleChannelClick}
          subscriptionIds={subscriptionIds}
          onSubscribe={toggleSubscription}
        />

        {/* Content Sections Below Hero */}
        <div className=" pt-8 relative px-6">
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black to-transparent pointer-events-none" />

          {/* Filter Bar */}
          <div className="mb-4">
            <FilterBar
              activeGenre={activeGenre}
              onGenreChange={handleGenreChange}
              availableGenres={availableGenresWithContent}
            />
          </div>

          <div className="max-w-full pr-3">
            {activeGenre === "all" ? (
              // Show original layout with content rows when "All" is selected
              <>
                {/* Continue Watching - Show trending content as placeholder */}
                {homeContent.trending.length > 0 && (
                  <HomeRow
                    title="Continue Watching"
                    items={homeContent.trending.slice(0, 8)}
                    onCardClick={handleHomeRowCardClick}
                  />
                )}

                {/* New Movies and Shows - Sort by created_at (newest first) */}
                {(() => {
                  const newContent = content.allContent
                    .filter((item) => item.created_at && !item.isKids) // Only items with created_at date and not kids content
                    .sort(
                      (a, b) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime(),
                    )
                    .slice(0, 8);

                  return (
                    newContent.length > 0 && (
                      <HomeRow
                        title="New Movies and Shows"
                        items={newContent}
                        onCardClick={handleHomeRowCardClick}
                      />
                    )
                  );
                })()}

                {/* Recommended - Show trending content */}
                {homeContent.trending.length > 0 && (
                  <HomeRow
                    title="Recommended"
                    items={homeContent.trending}
                    onCardClick={handleHomeRowCardClick}
                  />
                )}

                {/* Kids - Show kids content */}
                {(() => {
                  const kidsOnlyContent = content.allContent
                    .filter((item) => item.isKids === true)
                    .slice(0, 8);

                  return (
                    kidsOnlyContent.length > 0 && (
                      <HomeRow
                        title="Kids"
                        items={kidsOnlyContent}
                        onCardClick={handleHomeRowCardClick}
                      />
                    )
                  );
                })()}

                {/* Featured Movies - Use isFeatured flag only */}
                {(() => {
                  const featuredMovies = content.allContent
                    .filter(
                      (item) =>
                        item.type === "movie" &&
                        item.isFeatured === true &&
                        !item.isKids,
                    )
                    .slice(0, 8);

                  return (
                    featuredMovies.length > 0 && (
                      <HomeRow
                        title="Featured Movies"
                        items={featuredMovies}
                        onCardClick={handleHomeRowCardClick}
                      />
                    )
                  );
                })()}

                {/* Featured Shows - Use isFeatured flag only */}
                {(() => {
                  const featuredShows = content.allContent
                    .filter(
                      (item) =>
                        item.type === "series" &&
                        item.isFeatured === true &&
                        !item.isKids,
                    )
                    .slice(0, 8);

                  return (
                    featuredShows.length > 0 && (
                      <HomeRow
                        title="Featured Shows"
                        items={featuredShows}
                        onCardClick={handleHomeRowCardClick}
                      />
                    )
                  );
                })()}
              </>
            ) : (
              // Show filtered content for specific genre
              <>
                {filteredContent.length > 0 && (
                  <>
                    {/* New content row */}
                    <HomeRow
                      title="New Content"
                      items={filteredContent.slice(0, 8)}
                      onCardClick={handleHomeRowCardClick}
                    />

                    {/* Recommended row */}
                    <HomeRow
                      title={`Recommended`}
                      items={filteredContent.slice(2, 10)}
                      onCardClick={handleHomeRowCardClick}
                    />
                  </>
                )}

                {/* Grid Layout for all filtered content */}
                <div className="mt-8 mb-8 pl-4">
                  <h2 className="text-xl font-semibold mb-4">All Content</h2>

                  {filteredContent.length > 0 ? (
                    <ContentGrid
                      items={filteredContent}
                      onCardClick={handleHomeRowCardClick}
                    />
                  ) : (
                    <div className="text-center py-16">
                      <h3 className="text-xl font-bold mb-2">
                        No content found
                      </h3>
                      <p className="text-gray-400">
                        No {activeGenre} content available at the moment
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <footer className="bg-gray-800 border-t border-gray-700 py-8">
            <div className="max-w-7xl mx-auto px-4 text-center text-gray-400">
              <p>&copy; 2024 BUZUTV. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
});

Index.displayName = "Index";

export default Index;
