import { useState } from "react";
import ChannelModal from "@/components/ChannelModal";
import FullViewportHero from "@/components/FullViewportHero";
import FilterBar from "@/components/FilterBar";
import ContentGrid from "@/components/ContentGrid";
import { useAppContent } from "@/hooks/useAppContent";
import { useUserSubscriptions } from "@/hooks/useUserSubscriptions";
import { useAuth } from "@/contexts/AuthContext";
import HomeRow from "@/components/HomeRow";
import { featuredContentIds } from "@/data/featuredContentIds";
import { genres } from "@/data/mockMovies";

const Index = () => {
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [activeGenre, setActiveGenre] = useState("all");

  const { homeContent, channels, isLoading, content, kidsContent } =
    useAppContent();
  const { subscriptionIds, toggleSubscription } = useUserSubscriptions();
  const { isLoggedIn, setShowLoginModal } = useAuth();

  // Build featured array from full content objects
  const featured = featuredContentIds
    .map((id) => content.allContent.find((item) => item.id === id))
    .filter(Boolean);

  const handleChannelClick = (channel: any) => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    setSelectedChannel(channel);
    setShowChannelModal(true);
  };

  const handleCloseChannelModal = () => {
    setShowChannelModal(false);
    setSelectedChannel(null);
  };

  const handleHomeRowCardClick = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return true;
    }
    return false;
  };

  const handleGenreChange = (genre: string) => {
    setActiveGenre(genre);
  };

  // Get filtered content based on active genre
  const getFilteredContent = () => {
    if (activeGenre === "all") {
      return content.allContent;
    }

    // Filter by genre
    return content.allContent.filter(
      (item) => item.genre.toLowerCase() === activeGenre.toLowerCase(),
    );
  };

  const filteredContent = getFilteredContent();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white">
      {/* Fixed background gradient */}
      <div
        className="fixed inset-0"
        style={{
          background: `
      linear-gradient(
        200deg,
        rgb(249 115 22) 0%,
        rgb(194 65 12) 20%,
        black 45%,
        black 100%    
      )
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
              availableGenres={genres}
            />
          </div>

          <div className="max-w-full pr-3">
            {activeGenre === "all" ? (
              // Show original layout with content rows when "All" is selected
              <>
                {/* Show content only if we have any */}
                {Object.values(homeContent).some((arr) => arr.length > 0) ? (
                  <>
                    {/* Content Rows - New Layout for Homepage */}
                    {/* Continue Watching - Show trending content as placeholder (no watch history available) */}
                    {homeContent.trending.length > 0 && (
                      <HomeRow
                        title="Continue Watching"
                        items={homeContent.trending.slice(0, 8)}
                        onCardClick={handleHomeRowCardClick}
                      />
                    )}

                    {/* New Movies and Shows - Sort by created_at (newest first) with fallback */}
                    {(() => {
                      let newContent = content.allContent
                        .filter((item) => item.created_at)
                        .sort(
                          (a, b) =>
                            new Date(b.created_at).getTime() -
                            new Date(a.created_at).getTime(),
                        )
                        .slice(0, 8);

                      // Fallback: if no created_at data, use first 8 items from allContent
                      if (newContent.length === 0) {
                        newContent = content.allContent.slice(0, 8);
                      }

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

                    {/* Recommended - Show recommended content */}
                    {homeContent.trending.length > 0 && (
                      <HomeRow
                        title="Recommended"
                        items={homeContent.trending}
                        onCardClick={handleHomeRowCardClick}
                      />
                    )}

                    {/* Featured Movies - Use is_featured flag with fallback */}
                    {(() => {
                      let featuredMovies = content.allContent
                        .filter(
                          (item) => item.type === "movie" && item.is_featured,
                        )
                        .slice(0, 8);

                      // Fallback: if no featured movies, use highest rated movies
                      if (featuredMovies.length === 0) {
                        featuredMovies = content.allContent
                          .filter((item) => item.type === "movie")
                          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                          .slice(0, 8);
                      }

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

                    {/* Featured Shows - Use is_featured flag with fallback */}
                    {(() => {
                      let featuredShows = content.allContent
                        .filter(
                          (item) => item.type === "series" && item.is_featured,
                        )
                        .slice(0, 8);

                      // Fallback: if no featured shows, use highest rated series
                      if (featuredShows.length === 0) {
                        featuredShows = content.allContent
                          .filter((item) => item.type === "series")
                          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                          .slice(0, 8);
                      }

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
                  <div className="text-center py-16">
                    <h2 className="text-2xl font-bold mb-4">
                      No content available
                    </h2>
                    <p className="text-gray-400">
                      Content will appear here once it's added to the platform
                    </p>
                  </div>
                )}
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
                <div className="mt-8  pl-4">
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
};

export default Index;
