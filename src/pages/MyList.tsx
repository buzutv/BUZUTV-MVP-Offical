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
import { useGetPlaylistsWithItemsQuery, useLazyGetPlaylistsWithItemsByIdQuery, useDeletePlaylistMutation } from "@/store/playlistSlice";
import { useAuth } from "@/contexts/AuthContext";
import { useDispatch } from "react-redux";
import { setPlaylistInfo } from "@/store/screenPlayerSlice";
import { useNavigate } from "react-router-dom";
import { getOptimizedImageUrl } from "@/utils/youtubeUtils";
import { List, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  const { data: playlists = [], isLoading: playlistsLoading, refetch: refetchPlaylists } = useGetPlaylistsWithItemsQuery(user?.id);
  const [deletePlaylist] = useDeletePlaylistMutation();
  const [playlistToDelete, setPlaylistToDelete] = useState<{ id: string, title: string } | null>(null);

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

  const handleDeletePlaylist = async (e: React.MouseEvent, playlistId: string, title: string) => {
    e.stopPropagation();
    setPlaylistToDelete({ id: playlistId, title });
  };

  const confirmDeletePlaylist = async () => {
    if (!playlistToDelete) return;

    try {
      await deletePlaylist(playlistToDelete.id).unwrap();
      toast.success("Playlist deleted successfully");
      refetchPlaylists();
      setPlaylistToDelete(null);
    } catch (error) {
      console.error("Error deleting playlist:", error);
      toast.error("Failed to delete playlist");
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

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!playlistToDelete} onOpenChange={() => setPlaylistToDelete(null)}>
          <DialogContent className="sm:max-w-[425px] bg-[#120222] border-white/10 text-white backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-xl text-red-500 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Confirm Deletion
              </DialogTitle>
              <DialogDescription className="text-gray-300">
                Are you sure you want to delete the playlist
                <span className="font-bold text-white"> "{playlistToDelete?.title}"</span>?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setPlaylistToDelete(null)}
                className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeletePlaylist}
                className="bg-red-600 hover:bg-red-700 text-white border-none"
              >
                Delete Permanently
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
                    <List className="w-6 h-6 text-brand-200" />
                    My Playlists
                  </h2>
                  <div className="flex space-x-6 overflow-x-auto scrollbar-hide px-4 py-2">
                    {playlists.map((playlist) => {
                      const items = playlist.playlist_items || [];
                      const firstItemPoster = items[0]?.content?.poster_url;

                      return (
                        <div
                          key={playlist.id}
                          className="flex-shrink-0 w-64 group cursor-pointer perspective-1000"
                          onClick={() => handlePlaylistClick(playlist.id)}
                        >
                          <div className="relative aspect-[32/9] w-full mb-3 rounded-xl transition-all duration-500 transform-gpu group-hover:-translate-y-2">
                            {/* Stacked Card Background Decoration */}
                            <div className="absolute inset-0 bg-brand-500/10 rounded-xl transform translate-x-1 translate-y-1 -z-10 transition-transform duration-500 group-hover:translate-x-2 group-hover:translate-y-2" />

                            {/* Main Card */}
                            <div className="relative h-full w-full rounded-xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-md shadow-xl transition-all duration-500 group-hover:border-brand-400/50 group-hover:shadow-brand-500/30">
                              {firstItemPoster ? (
                                <img
                                  src={getOptimizedImageUrl(firstItemPoster, 400)}
                                  alt={playlist.title}
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-900/40 to-black/40">
                                  <List className="w-6 h-6 text-brand-400/40 mr-2" />
                                  <span className="text-[10px] uppercase tracking-widest text-brand-400/60 font-bold">Empty Playlist</span>
                                </div>
                              )}

                              {/* Overlay Gradient */}
                              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent opacity-80" />

                              {/* Content Info */}
                              <div className="absolute inset-0 flex items-center justify-between px-4">
                                <div className="flex-1 min-w-0 pr-8">
                                  <h3 className="text-sm font-bold text-white mb-0.5 line-clamp-1 group-hover:text-brand-300 transition-colors">
                                    {playlist.title}
                                  </h3>
                                  <div className="flex items-center gap-2">
                                    <div className="h-0.5 w-4 bg-brand-500 rounded-full" />
                                    <span className="text-[9px] text-gray-400 font-medium uppercase tracking-wider">{items.length} items</span>
                                  </div>
                                </div>
                                <div className="bg-brand-500/90 backdrop-blur-sm p-1.5 rounded-lg shadow-lg flex-shrink-0">
                                  <List className="w-3.5 h-3.5 text-white" />
                                </div>
                              </div>

                              {/* Delete Button */}
                              <button
                                onClick={(e) => handleDeletePlaylist(e, playlist.id, playlist.title)}
                                className="absolute top-1/2 -translate-y-1/2 right-2 p-1.5 bg-black/40 hover:bg-red-500 text-white rounded-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-1 group-hover:translate-x-0 z-30 border border-white/10"
                                title="Delete Playlist"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
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
