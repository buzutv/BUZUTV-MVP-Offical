import React, { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import ChannelCard from "@/components/ChannelCard";
import ChannelModal from "@/components/ChannelModal";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ContentRow from "@/components/ContentRow";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import { useUserChannelFavorites } from "@/hooks/useUserChannelFavorites";
import { useAppContent } from "@/hooks/useAppContent";
import { Spinner } from "@/components/ui/spinner";
import { useGetPlaylistsWithItemsQuery, useLazyGetPlaylistsWithItemsByIdQuery } from "@/store/playlistSlice";
import { useAuth } from "@/contexts/AuthContext";
import { useDispatch } from "react-redux";
import { setPlaylistInfo } from "@/store/screenPlayerSlice";
import { useNavigate } from "react-router-dom";
import { getOptimizedImageUrl } from "@/utils/youtubeUtils";
import { List } from "lucide-react";

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
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [triggerPlaylists] = useLazyGetPlaylistsWithItemsByIdQuery();
  const { data: playlists = [], isLoading: playlistsLoading } = useGetPlaylistsWithItemsQuery(user?.id);

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

  const handlePlaylistClick = async (playlistId: string) => {
    navigate(`/playlists/${playlistId}`);
    try {
      const fetchedPlaylists = await triggerPlaylists({ userId: user?.id, playlist_id: playlistId }).unwrap();
      dispatch(setPlaylistInfo({
        playlistInfo: fetchedPlaylists
      }));
    } catch (error) {
      console.error("Error fetching playlist detail:", error);
    }
  };

  const isLoading = useMemo(() => {
    const loading = favoritesLoading || channelFavoritesLoading || playlistsLoading;

    return loading;
  }, [favoritesLoading, channelFavoritesLoading, playlistsLoading]);

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
            <div className="text-2xl font-bold text-white">
              <Spinner className="w-12 h-12" />
            </div>
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

              {/* Playlists Row */}
              {playlists.length > 0 && (
                <section className="mb-10">
                  <h2 className="text-2xl mb-4 px-4 flex items-center gap-2">
                    <List className="w-6 h-6 text-brand-400" />
                    My Playlists
                  </h2>
                  <div className="flex space-x-6 overflow-x-auto scrollbar-hide px-4 py-2">
                    {playlists.map((playlist) => {
                      const items = playlist.playlist_items || [];
                      const firstItemPoster = items[0]?.content?.poster_url;

                      return (
                        <div
                          key={playlist.id}
                          className="flex-shrink-0 w-48 group cursor-pointer"
                          onClick={() => handlePlaylistClick(playlist.id)}
                        >
                          <div className="relative aspect-[2/3] w-full mb-2 rounded-lg overflow-hidden border border-white/10 group-hover:border-brand-500/50 transition-all duration-300 shadow-lg group-hover:shadow-brand-500/20 group-hover:-translate-y-1">
                            {firstItemPoster ? (
                              <img
                                src={getOptimizedImageUrl(firstItemPoster, 200)}
                                alt={playlist.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                            ) : (
                              <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                <List className="w-8 h-8 text-white/20" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                            <div className="absolute bottom-1 right-1 bg-brand-600/90 text-[10px] px-1.5 py-0.5 rounded font-bold">
                              {items.length}
                            </div>
                          </div>
                          <p className="text-xs font-medium text-white/90 line-clamp-1 group-hover:text-brand-400 transition-colors text-center">
                            {playlist.title}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

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
              {savedContent.length === 0 && favoriteChannels.length === 0 && playlists.length === 0 && (
                <div className="text-center py-16">
                  <h2 className="text-2xl mb-4">
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
      </div>
    </ProtectedRoute>
  );
});

MyList.displayName = "MyList";

export default MyList;
