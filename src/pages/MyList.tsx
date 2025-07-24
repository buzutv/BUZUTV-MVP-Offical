import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import MovieCard from "@/components/MovieCard";
import ChannelCard from "@/components/ChannelCard";
import ChannelModal from "@/components/ChannelModal";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import MovieHoverRow from "@/components/MovieHoverRow";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import { useUserSubscriptions } from "@/hooks/useUserSubscriptions";
import { useUserChannelFavorites } from "@/hooks/useUserChannelFavorites";
import { useAppContent } from "@/hooks/useAppContent";
import SeriesCard from "@/components/SeriesCard";

const MyList = () => {
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const { favoriteIds, isLoading: favoritesLoading } = useUserFavorites();
  const {
    subscriptionIds,
    toggleSubscription,
    isLoading: subscriptionsLoading,
  } = useUserSubscriptions();
  const { favoriteChannelIds, isLoading: channelFavoritesLoading } =
    useUserChannelFavorites();
  const { movies, channels } = useAppContent();

  const savedContent =
    favoriteIds.length > 0
      ? movies.filter((item) => favoriteIds.includes(item.id))
      : [];

  const subscribedChannels =
    subscriptionIds.length > 0
      ? channels.filter((channel) => subscriptionIds.includes(channel.id))
      : [];

  const favoriteChannels =
    favoriteChannelIds.length > 0
      ? channels.filter((channel) => favoriteChannelIds.includes(channel.id))
      : [];

  // Separate movies and TV shows
  const savedMovies = savedContent.filter((item) => item.type === "movie");
  const savedTVShows = savedContent.filter((item) => item.type === "series");

  // Debug log for MyList page content
  console.log('❤️ [MyList] User favorites and subscriptions:', {
    totalMoviesAvailable: movies.length,
    totalChannelsAvailable: channels.length,
    favoriteIds: favoriteIds,
    savedContentCount: savedContent.length,
    savedMoviesCount: savedMovies.length,
    savedTVShowsCount: savedTVShows.length,
    subscribedChannelsCount: subscribedChannels.length,
    favoriteChannelsCount: favoriteChannels.length,
    savedContentTypes: savedContent.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    savedContentTitles: savedContent.slice(0, 5).map(item => item.title),
    subscribedChannelNames: subscribedChannels.map(ch => ch.name),
    favoriteChannelNames: favoriteChannels.map(ch => ch.name)
  });

  const handleChannelClick = (channel: any) => {
    setSelectedChannel(channel);
    setShowChannelModal(true);
  };

  const handleCloseChannelModal = () => {
    setShowChannelModal(false);
    setSelectedChannel(null);
  };

  const isLoading =
    favoritesLoading || subscriptionsLoading || channelFavoritesLoading;

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <div className="text-2xl">Loading...</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      {/* Fixed background gradient */}
      <div className="fixed inset-0 bg-gradient-to-t from-black via-brand-800 to-brand-500"></div>

      <div className="relative min-h-screen text-white">
        {/* Channel Modal */}
        <ChannelModal
          isOpen={showChannelModal}
          onClose={handleCloseChannelModal}
          channel={selectedChannel}
        />

        {/* Navigation */}
        {/* Removed Navbar */}

        <div className="pt-16">
          <div className="max-w-full px-2 py-8">
            {/* Page Title */}
            <div className="px-4 mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">My List</h1>
              <p className="text-gray-400">
                Your saved movies, shows, and subscriptions
              </p>
            </div>

            {/* My Subscriptions */}
            {subscribedChannels.length > 0 && (
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4 px-4">
                  My Subscriptions
                </h2>
                <div className="flex space-x-4 overflow-x-auto scrollbar-hide px-4">
                  {subscribedChannels.map((channel) => (
                    <div key={channel.id} className="flex-shrink-0 w-48">
                      <div onClick={() => handleChannelClick(channel)}>
                        <ChannelCard
                          channel={channel}
                          isSubscribed={true}
                          onSubscribe={toggleSubscription}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

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
                          isSubscribed={subscriptionIds.includes(channel.id)}
                          onSubscribe={toggleSubscription}
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
                        <MovieCard movie={movie} showSaveButton={false} />
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
              subscribedChannels.length === 0 &&
              favoriteChannels.length === 0 && (
                <div className="text-center py-16">
                  <h2 className="text-2xl font-bold mb-4">
                    Your favorites list is empty
                  </h2>
                  <p className="text-gray-400 mb-8">
                    Start adding movies, series, and channels to your favorites
                  </p>
                  <Link
                    to="/"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
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
};

export default MyList;
