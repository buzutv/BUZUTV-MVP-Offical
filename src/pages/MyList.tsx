import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BrandButton from "@/components/ui/BrandButton";
import { Bookmark, Heart } from "lucide-react";
import ChannelCard from "@/components/ChannelCard";
import ChannelModal from "@/components/ChannelModal";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ContentRow from "@/components/ContentRow";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import { useUserChannelFavorites } from "@/hooks/useUserChannelFavorites";
import { useAppContent } from "@/hooks/useAppContent";

const MyList = React.memo(() => {
  const navigate = useNavigate();
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [showChannelModal, setShowChannelModal] = useState(false);

  const startTime = performance.now();
  const { favoriteIds, isLoading: favoritesLoading } = useUserFavorites();

  const channelFavStart = performance.now();
  const { favoriteChannelIds, isLoading: channelFavoritesLoading } =
    useUserChannelFavorites();

  const appContentStart = performance.now();
  const { movies, channels } = useAppContent();

  const savedContent = useMemo(() => {
    const filterStart = performance.now();
    const result =
      favoriteIds.length > 0
        ? movies.filter((item) => favoriteIds.includes(item.id))
        : [];
    return result;
  }, [favoriteIds, movies]);

  const favoriteChannels = useMemo(() => {
    const filterStart = performance.now();
    const result =
      favoriteChannelIds.length > 0
        ? channels.filter((channel) => favoriteChannelIds.includes(channel.id))
        : [];
    return result;
  }, [favoriteChannelIds, channels]);

  const savedMovies = useMemo(() => {
    const result = savedContent.filter((item) => item.type === "movie");
    return result;
  }, [savedContent]);

  const savedTVShows = useMemo(() => {
    const result = savedContent.filter((item) => item.type === "series");
    return result;
  }, [savedContent]);

  const handleChannelClick = useCallback((channel: any) => {
    setSelectedChannel(channel);
    setShowChannelModal(true);
  }, []);

  const handleCloseChannelModal = useCallback(() => {
    setShowChannelModal(false);
    setSelectedChannel(null);
  }, []);

  const isLoading = useMemo(() => {
    const loading = favoritesLoading || channelFavoritesLoading;

    return loading;
  }, [favoritesLoading, channelFavoritesLoading]);

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
            <div className="text-2xl font-bold text-white">Loading...</div>
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
        {/* Channel Modal */}
        <ChannelModal
          isOpen={showChannelModal}
          onClose={handleCloseChannelModal}
          channel={selectedChannel}
        />

        <div className="pt-16">
          <div className="pr-6 pl-0 md:pr-8 md:pl-6 py-8">
            <div className="max-w-full pr-3">
              {/* Page Title */}
              <div className="px-4 mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">My List</h1>
                <p className="text-white">
                  Your saved movies, shows, and favorite channels
                </p>
              </div>

              {/* Favorite Channels */}
              {favoriteChannels.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-2xl mb-4 px-4 flex items-center gap-2">
                    <Heart
                      className="w-6 h-6 text-red-500"
                      fill="currentColor"
                    />
                    Favorite Channels
                  </h2>
                  <div className="flex space-x-4 overflow-x-auto scrollbar-hide px-4">
                    {favoriteChannels.map((channel) => (
                      <div key={channel.id} className="flex-shrink-0 w-48">
                        <div onClick={() => handleChannelClick(channel)}>
                          <ChannelCard channel={channel} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Movies */}
              {savedMovies.length > 0 && (
                <ContentRow title="Movies" items={savedMovies} />
              )}

              {/* TV Shows */}
              {savedTVShows.length > 0 && (
                <ContentRow title="TV Shows" items={savedTVShows} />
              )}

              {/* Empty State */}
              {savedContent.length === 0 && favoriteChannels.length === 0 && (
                <div className="text-center py-16 px-4">
                  <Bookmark className="w-16 h-16 text-brand-500 mx-auto mb-6" aria-hidden="true" />
                  <h2 className="text-2xl font-bold mb-3">Your list is empty</h2>
                  <p className="text-gray-400 mb-8 max-w-sm mx-auto">
                    Save movies and shows to watch later
                  </p>
                  <BrandButton
                    variant="primary"
                    onClick={() => navigate("/")}
                  >
                    Browse content
                  </BrandButton>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
});

MyList.displayName = "MyList";

export default MyList;
