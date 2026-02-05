import React, { useCallback, useMemo, useState } from "react";
import ChannelModal from "@/components/ChannelModal";
import FullViewportHero from "@/components/FullViewportHero";
import FilterBar from "@/components/FilterBar";
import ContentGrid from "@/components/ContentGrid";
import ContentModal from "@/components/ContentModal";
import { useAppContent } from "@/hooks/useAppContent";
import { useContent } from "@/hooks/useContent";
import { useChannels } from "@/hooks/useChannels";
import { useUserSubscriptions } from "@/hooks/useUserSubscriptions";
import { useAuth } from "@/contexts/AuthContext";
import ContentRow from "@/components/ContentRow";
import { featuredContentIds } from "@/data/featuredContentIds";
import { Spinner } from "@/components/ui/spinner"
interface Channel {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  logo_url?: string;
  banner_url?: string;
  is_active?: boolean;
  isActive?: boolean;
  created_at?: string;
  updated_at?: string;
}

const Index = React.memo(() => {
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [activeGenre, setActiveGenre] = useState("all");

  const startTime = performance.now();
  const { homeContent, channels, isLoading, content, kidsContent, movieContent, seriesContent } = useAppContent();
  const { content: rawContent } = useContent();
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const availableGenresWithContent = useMemo((): string[] => {
    if (!content.allContent || content.allContent.length === 0) {
      return ["All"];
    }

    const contentGenres: string[] = Array.from(
      new Set(
        content.allContent
          .filter((item) => !item.isKids)
          .map((item) => item.genre)
          .filter((genre): genre is string => Boolean(genre)),
      ),
    );

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
    (channel: Channel) => {
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

  const handleContentRowCardClick = useCallback((item?: any) => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return true;
    }
    if (item) {
      setSelectedItem(item);
      return true; // Prevents the card's internal modal
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
              )`,
          }}
        ></div>
        <div className="relative flex items-center justify-center min-h-screen">
          <div className="text-2xl font-bold text-white"><Spinner /></div>
        </div>
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
        />

        {/* Content Sections Below Hero */}
        <div className="pt-8 relative pr-6 pl-0 md:pr-8 md:pl-6">
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black to-transparent pointer-events-none" />

          {isLoggedIn && (
            <>
              {/* Unified Continue Watching for Home */}
              {(() => {
                const combinedHistory = [...(movieContent.continueWatching || []), ...(seriesContent.continueWatching || [])]
                  .sort((a, b) => {
                    const historyA = Array.isArray(a.user_watch_history) ? a.user_watch_history[0] : a.user_watch_history;
                    const historyB = Array.isArray(b.user_watch_history) ? b.user_watch_history[0] : b.user_watch_history;
                    return new Date(historyB?.watched_at || 0).getTime() - new Date(historyA?.watched_at || 0).getTime();
                  })
                  .slice(0, 10);

                return combinedHistory.length > 0 && (
                  <ContentRow
                    title="Continue Watching"
                    items={combinedHistory}
                    onCardClick={handleContentRowCardClick}
                  />
                );
              })()}
            </>
          )}

          {/* Filter Bar moved below Continue Watching */}
          <div className="mb-8 px-6 pt-4">
            <FilterBar
              activeGenre={activeGenre}
              onGenreChange={handleGenreChange}
              availableGenres={availableGenresWithContent}
            />
          </div>

          <div className="max-w-full">
            {activeGenre === "all" ? (
              <>
                {/* Trending row */}
                {homeContent.trending.length > 0 && (
                  <ContentRow
                    title="Trending Programs"
                    items={homeContent.trending.slice(0, 10)}
                    onCardClick={handleContentRowCardClick}
                  />
                )}

                {/* Recommended row */}
                <ContentRow
                  key={`recommended-content-${activeGenre}`}
                  title="Recommended for You"
                  items={filteredContent.slice(2, 12)}
                  onCardClick={handleContentRowCardClick}
                />

                {/* Individual Genre Rows for All Content */}
                {[
                  "Comedy", "Drama", "Sports", "Romance",
                  "Action", "Lifestyle", "Documentary", "Informational"
                ].map(genre => {
                  const genreItems = content.allContent.filter(item => item.genre === genre && !item.isKids);
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
              /* Specific Genre View */
              <>
                <ContentRow
                  key={`new-content-${activeGenre}`}
                  title={`New ${activeGenre} Content`}
                  items={filteredContent.slice(0, 8)}
                  onCardClick={handleContentRowCardClick}
                />
                <ContentRow
                  key={`recommended-${activeGenre}`}
                  title={`Recommended ${activeGenre}`}
                  items={filteredContent.slice(2, 10)}
                  onCardClick={handleContentRowCardClick}
                />
                <div className="mt-8 mb-8 pl-4">
                  <h2 className="text-2xl mb-4">All {activeGenre}</h2>
                  {filteredContent.length > 0 ? (
                    <ContentGrid
                      items={filteredContent}
                      onCardClick={handleContentRowCardClick}
                    />
                  ) : (
                    <div className="text-center py-16 text-gray-400 font-medium">No results found for {activeGenre}</div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <footer className=" border-t border-white/10 py-8">
            <div className="max-w-7xl mx-auto px-4 text-center text-gray-400">
              <p>&copy; 2024 BUZUTV. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </div>

      {/* Page-level Content Modal */}
      {selectedItem && (
        <ContentModal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          item={selectedItem}
          variant="auto"
          autoDetectKids={true}
          onPlayEpisode={() => { }} // Enables internal player mode
          movieId={selectedItem.id}
          videoUrl={rawContent.find((i) => i.id === selectedItem.id)?.video_url}
          channel={channels.find((c) => c.id === selectedItem.channelId) as any}
        />
      )}
    </div>
  );
});

Index.displayName = "Index";

export default Index;
