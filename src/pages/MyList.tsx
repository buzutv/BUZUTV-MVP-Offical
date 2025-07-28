import React, { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import OptimizedMovieCard from "@/components/OptimizedMovieCard";
import ChannelCard from "@/components/ChannelCard";
import ChannelModal from "@/components/ChannelModal";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import MovieHoverRow from "@/components/MovieHoverRow";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import { useUserChannelFavorites } from "@/hooks/useUserChannelFavorites";
import { useAppContent } from "@/hooks/useAppContent";
import SeriesCard from "@/components/SeriesCard";

const MyList = React.memo(() => {
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
          <div className="max-w-full px-2 py-8">
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
                <h2 className="text-2xl font-bold mb-4 px-4 flex items-center gap-2">
                  <Heart className="w-6 h-6 text-red-500" fill="currentColor" />
                  Favorite Channels
                </h2>
                <div className="flex space-x-4 overflow-x-auto scrollbar-hide px-4">
                  {favoriteChannels.map((channel) => (
                    <div key={channel.id} className="flex-shrink-0 w-48">
                      <div onClick={() => handleChannelClick(channel)}>
                        <ChannelCard
                          channel={channel}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Movies */}
            {savedMovies.length > 0 && (
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 px-4">Movies</h2>
                <div className="flex space-x-2 overflow-x-auto scrollbar-hide px-4">
                  <MovieHoverRow className="flex space-x-2">
                    {savedMovies.map((movie) => (
                      <div key={movie.id} className="flex-shrink-0 w-64">
                        <OptimizedMovieCard
                          movie={movie}
                          showSaveButton={false}
                        />
                      </div>
                    ))}
                  </MovieHoverRow>
                </div>
              </section>
            )}

            {/* TV Shows */}
            {savedTVShows.length > 0 && (
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 px-4">TV Shows</h2>
                <div className="flex space-x-2 overflow-x-auto scrollbar-hide px-4">
                  <MovieHoverRow className="flex space-x-2">
                    {savedTVShows.map((show) => (
                      <div key={show.id} className="flex-shrink-0 w-64">
                        <SeriesCard series={show} />
                      </div>
                    ))}
                  </MovieHoverRow>
                </div>
              </section>
            )}

            {/* Empty State */}
            {savedContent.length === 0 &&
              favoriteChannels.length === 0 && (
                <div className="text-center py-16">
                  <h2 className="text-2xl font-bold mb-4">
                    Your favorites list is empty
                  </h2>
                  <p className="text-white mb-8">
                    Start adding movies, series, and channels to your favorites
                  </p>
                  <Link
                    to="/"
                    className="inline-flex items-center justify-center gap-3 rounded-full font-medium text-white transition-all duration-300 hover:scale-105 px-6 py-3 text-sm bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 hover:from-brand-700 hover:via-brand-800 hover:to-brand-900"
                  >
                    Browse Content
                  </Link>
                </div>
              )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
});

MyList.displayName = "MyList";

export default MyList;
