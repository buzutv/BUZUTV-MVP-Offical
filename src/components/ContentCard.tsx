import React, { useCallback, useEffect, useMemo, useState } from "react";
import { EllipsisVertical, Heart, ListMinus, Play } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Movie } from "@/data/mockMovies";
import { useAuth } from "@/contexts/AuthContext";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import { useContent } from "@/hooks/useContent";
import { useChannels } from "@/hooks/useChannels";
import ContentModal from "@/components/ContentModal";
import FullscreenPlayer from "@/components/FullscreenPlayer";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { supabase } from "@/integrations/supabase/client";
import usePlaylists from "@/hooks/usePlaylists";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { openScreenPlayer, closeScreenPlayer } from "@/store/screenPlayerSlice";
import { getOptimizedImageUrl } from "@/utils/youtubeUtils";
import { Content } from "@/types";
import { useCreatePlaylistMutation, useAddPlaylistItemMutation } from "@/store/playlistSlice";

export interface ContentCardProps {
  item: Movie | any;
  variant?: "movie" | "series" | "auto";
  isKidsMode?: boolean;
  autoDetectKids?: boolean;
  showSaveButton?: boolean;
  showProgress?: boolean;
  progressPercent?: number;
  showResumeButton?: boolean;
  onPlayFullscreen?: (videoUrl: string) => void;
  onOpen?: (item: any) => boolean;
  onItemClick?: (item: Movie | any) => void;
  className?: string;
  isMoreLikeThis?: boolean;
  width?: string;
  playlists?: any[];
  hideGradient?: boolean;
}

const ContentCard = ({
  item,
  variant = "auto",
  isKidsMode,
  autoDetectKids = true,
  showSaveButton = true,
  showProgress = false,
  progressPercent = 0,
  showResumeButton = false,
  onPlayFullscreen,
  onOpen,
  onItemClick,
  className = "",
  isMoreLikeThis = false,
  width = "auto",
  playlists,
  hideGradient = false
}: ContentCardProps) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isLoggedIn, setShowLoginModal, user } = useAuth();
  const { favoriteIds, addToFavorites, removeFromFavorites } = useUserFavorites();
  const { content, refetch: refetchContent } = useContent();
  const { channels } = useChannels();
  const [createPlaylist] = useCreatePlaylistMutation();
  const [addPlaylistItem] = useAddPlaylistItemMutation();
  const { playlists: fetchedPlaylists } = usePlaylists();

  const displayPlaylists = playlists || fetchedPlaylists;

  // State for playlist creation form
  const [playlistForm, setPlaylistForm] = useState<{
    title: string;
  }>({
    title: '',
  });

  console.log("Content Card", item)

  // State to control the create playlist dialog
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);

  const [currentModalItem, setCurrentModalItem] = useState<Movie | Content | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState("");
  const [currentVideoTitle, setCurrentVideoTitle] = useState("");

  const effectiveKidsMode =
    isKidsMode ?? (autoDetectKids ? location.pathname === "/kids" : false);

  const contentType = variant === "auto" ? item.type || "movie" : variant;
  const normalizedItem = useMemo(
    () => ({
      id: item.id,
      title: item.title || item.name,
      posterUrl: item.posterUrl || item.poster_url || "/placeholder.svg",
      type: item.type || "movie",
      genre: item.genre,
      year: item.year,
      rating: item.rating,
      channelId: item.channelId || item.channel_id,
      isKids: item.isKids || item.is_kids,
      ...item,
    }),
    [item]
  );


  const actualItem = currentModalItem || normalizedItem;
  console.log("Normalized Item", normalizedItem)

  const isSaved = favoriteIds.includes(actualItem.id);

  const contentItem = content.find((c) => c.id === actualItem.id);
  const videoUrl = contentItem?.video_url;

  const channel = channels.find((ch) => ch.id === actualItem.channelId);

  const watchHistory = useMemo(() => {
    const history = normalizedItem.user_watch_history;
    if (!history) return null;
    if (Array.isArray(history)) {
      return [...history].sort((a, b) =>
        new Date(b.watched_at || 0).getTime() - new Date(a.watched_at || 0).getTime()
      )[0];
    }
    return history;
  }, [normalizedItem.user_watch_history]);

  const effectiveShowProgress = showProgress || (watchHistory && watchHistory.watch_percentage > 0 && watchHistory.watch_percentage < 100);
  const effectiveProgressPercent = progressPercent || watchHistory?.watch_percentage || 0;
  const effectiveShowResumeButton = showResumeButton || (watchHistory && watchHistory.watch_percentage > 0 && watchHistory.watch_percentage < 100);

  const handleSave = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (isSaved) removeFromFavorites(actualItem.id);
      else addToFavorites(actualItem.id);
    },
    [isSaved, actualItem.id, addToFavorites, removeFromFavorites]
  );

  const handleCardClick = useCallback(() => {
    if (onOpen && (onOpen as any)(actualItem) === true) return;

    if (onItemClick) {
      onItemClick(actualItem);
      return;
    }

    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    setCurrentModalItem(actualItem);
  }, [onOpen, onItemClick, actualItem, isLoggedIn, setShowLoginModal]);


  const handleAddtoPlaylist = useCallback(async (playlistId: string) => {
    try {
      await addPlaylistItem([{
        id: crypto.randomUUID(),
        playlist_id: playlistId,
        position: 0,
        content_id: actualItem.id
      }]).unwrap();

      toast.success("Movie successfully added to playlist!");
    }
    catch (error: any) {
      console.log("Error adding to playlist:", error);
      if (error?.data?.message?.includes('duplicate key value violates unique constraint') ||
        error?.message?.includes('duplicate key value')) {
        toast.error("This Movie is already in the selected playlist.");
      } else {
        toast.error("Failed to add to playlist.");
      }
    }
  }, [actualItem, addPlaylistItem]);

  const handleModalPlayClick = useCallback(() => {
    if (!contentItem?.video_url) return;

    const vidUrl = contentItem.video_url;
    const vidTitle = actualItem.title;

    dispatch(openScreenPlayer({
      isOpen: true,
      selectedVideo: contentItem || actualItem,
      selectedVideoTitle: vidTitle,
      videoUrl: vidUrl,
      contentId: actualItem.id,
      poster_url: actualItem.poster_url || actualItem.posterUrl,
      isSeries: actualItem.type === 'series'
    }));

    if (onPlayFullscreen) {
      onPlayFullscreen(vidUrl);
      setCurrentModalItem(null);
    } else {
      setCurrentModalItem(null);
      setTimeout(() => {
        setCurrentVideoUrl(vidUrl);
        setCurrentVideoTitle(vidTitle);
        setIsFullscreen(true);
      }, 200);
    }
  }, [contentItem, onPlayFullscreen, actualItem, dispatch]);


  const handleSubmitPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        title: playlistForm.title,
        created_by: user?.id
      };

      await createPlaylist(payload).unwrap();

      toast.success("Playlist created successfully!");
      setIsCreatePlaylistOpen(false);
      setPlaylistForm({ title: '' });
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast.error("Failed to create playlist.");
    }
  }

  const handlePlayEpisode = useCallback(
    (videoUrl: string, episodeTitle: string) => {
      dispatch(openScreenPlayer({
        isOpen: true,
        selectedVideo: actualItem, // Current series
        selectedVideoTitle: episodeTitle,
        videoUrl: videoUrl,
        contentId: actualItem.id,
        poster_url: actualItem.poster_url || actualItem.posterUrl,
        isSeries: actualItem.type === 'series'
      }));

      if (onPlayFullscreen) {
        onPlayFullscreen(videoUrl);
        setCurrentModalItem(null);
      } else {
        setCurrentModalItem(null);
        setTimeout(() => {
          setCurrentVideoUrl(videoUrl);
          setCurrentVideoTitle(episodeTitle);
          setIsFullscreen(true);
        }, 200);
      }
    },
    [onPlayFullscreen, actualItem, dispatch]
  );

  const handleExitFullscreen = () => {
    refetchContent();
    dispatch(closeScreenPlayer());
    setIsFullscreen(false);
    setCurrentVideoUrl("");
    setCurrentVideoTitle("");
  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    setPlaylistForm({ ...playlistForm, [name]: value });
  }

  const handleSaveModal = useCallback(() => {
    if (isSaved) removeFromFavorites(actualItem.id);
    else addToFavorites(actualItem.id);
  }, [isSaved, actualItem.id, addToFavorites, removeFromFavorites]);

  const recommendedContent = useMemo(
    () =>
      content
        .filter(
          (c) =>
            c.id !== actualItem.id &&
            (c.genre === actualItem.genre || c.channel_id === actualItem.channelId)
        )
        .slice(0, 6),
    [content, actualItem.id, actualItem.genre, actualItem.channelId]
  );

  const gradientClasses = effectiveKidsMode
    ? {
      base: "bg-[linear-gradient(to_top,rgba(37,99,235,0.95)_0%,rgba(37,99,235,0.9)_40%,rgba(37,99,235,0.4)_60%,rgba(37,99,235,0.2)_80%,rgba(37,99,235,0.1)_90%,transparent_100%)]",
      hover:
        "bg-[linear-gradient(to_top,rgba(37,99,235,0.95)_0%,rgba(37,99,235,0.7)_30%,rgba(37,99,235,0.4)_60%,transparent_90%)]",
    }
    : {
      base: "bg-[linear-gradient(to_top,rgba(0,0,0,0.95)_0%,rgba(0,0,0,0.7)_30%,rgba(0,0,0,0.4)_60%,rgba(0,0,0,0.2)_80%,rgba(0,0,0,0.1)_90%,transparent_100%)]",
      hover:
        "bg-[linear-gradient(to_top,rgba(0,0,0,0.95)_0%,rgba(0,0,0,0.7)_30%,rgba(0,0,0,0.4)_60%,transparent_90%)]",
    };

  const widthClass =
    isMoreLikeThis ? "w-64 aspect-video flex-shrink-0" : width === "auto" ? "" : width;

  return (
    <>
      {isFullscreen && currentVideoUrl && (
        <FullscreenPlayer
          isOpen={isFullscreen}
          onClose={handleExitFullscreen}
          videoUrl={currentVideoUrl}
          title={currentVideoTitle}
          userId={user?.id} // Pass userId prop
          type={item?.type}
          movieId={item?.id}

        />
      )}

      <div
        className={`content-card group ${widthClass} border-2 border-transparent hover:scale-105 hover:border-white hover:shadow-[0_0_4px_rgba(255,255,255,0.6)] focus:scale-105 focus:border-white focus:shadow-[0_0_4px_rgba(255,255,255,0.6)] focus:outline-none rounded-lg transition-all duration-300 overflow-hidden relative ${className}
          ${!hideGradient ? "bg-gradient-to-t from-black/90 from-0% via-black/40 via-40% to-transparent to-90%" : ""}
          ${!className.includes('aspect-') && !isMoreLikeThis ? "aspect-video" : ""}
        `}
        tabIndex={0}
        aria-label={`${normalizedItem.type === "series" ? "View series" : "View movie"} ${normalizedItem.title
          }`}
        onKeyDown={(e) => {
          // Don't trigger card click if we're typing in an input or textarea
          if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
            return;
          }
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCardClick();
          }
        }}
      >
        {/* ✅ Ellipsis Button in Top-Right Corner - ONLY FOR MOVIES */}
        {(
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
                onClick={(e) => e.stopPropagation()} // Prevent card click when clicking popover
              >
                <EllipsisVertical className="w-5 h-5" />
              </Button>
            </PopoverTrigger>

            <PopoverContent className="min-w-[220px] p-2 flex flex-col gap-2 bg-[#120222] border-white/10 text-white backdrop-blur-xl" onInteractOutside={(e) => e.stopPropagation()}>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-3 w-full p-2 hover:bg-white/10 rounded-md transition-colors text-sm font-medium"
                >
                  <Heart className={`w-4 h-4 ${isSaved ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
                  {isSaved ? "Remove from Favorites" : "Add to Favorites"}
                </button>

                <div className="h-px bg-white/10 my-1" />

                <Dialog open={isCreatePlaylistOpen} onOpenChange={setIsCreatePlaylistOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white text-sm p-2">
                      Create New Playlist
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="max-w-md bg-[#120222] border-white/10 text-white backdrop-blur-xl" onPointerDownCapture={(e) => e.stopPropagation()} onKeyDownCapture={(e) => e.stopPropagation()}>
                    <DialogHeader>
                      <DialogTitle className="text-white">Create New Playlist</DialogTitle>
                    </DialogHeader>
                    <form className="grid gap-4 py-4" onSubmit={handleSubmitPlaylist}>
                      <div className="grid gap-2">
                        <label htmlFor="playlist-title" className="text-sm font-medium">
                          Playlist Name
                        </label>
                        <input
                          type="text"
                          id="playlist-title"
                          name="title"
                          value={playlistForm.title}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 text-white placeholder:text-gray-500"
                          placeholder="My Awesome Playlist"
                          required
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>
                      <Button type="submit" className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold">
                        Create Playlist
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>

                <div className="h-px bg-white/10 my-1" />

                <span className="text-[10px] font-bold text-gray-400 uppercase px-2 tracking-wider">Add to Playlist</span>
                <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto custom-scrollbar">
                  {displayPlaylists?.map((playlist) => (
                    <div
                      key={playlist.id}
                      className="flex items-center justify-between p-2 hover:bg-white/10 rounded-md transition-colors group/pl"
                    >
                      <span className="text-sm truncate max-w-[130px] text-gray-200" title={playlist.title}>{playlist.title}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-brand-400 hover:text-brand-300 hover:bg-transparent"
                        onClick={() => handleAddtoPlaylist(playlist?.id)}
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                  {(!displayPlaylists || displayPlaylists.length === 0) && (
                    <div className="text-sm text-gray-500 p-2 italic">No playlists found</div>
                  )}
                </div>
              </div>

            </PopoverContent>
          </Popover>
        )}

        <div className="block cursor-pointer h-full" onClick={handleCardClick}>
          <div className="relative overflow-hidden transition-all duration-300 h-full">
            <div className="w-full h-full">
              <img
                src={normalizedItem.posterUrl}
                alt={`${normalizedItem.title} poster`}
                className="w-full h-full rounded-lg object-cover transform transition-transform duration-300 hover:scale-[1.1]"
                loading="lazy"
                decoding="async"
              />
            </div>

            {effectiveShowProgress && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600">
                <div
                  className="h-full bg-red-600 transition-all duration-300"
                  style={{ width: `${effectiveProgressPercent}%` }}
                />
              </div>
            )}

            {!hideGradient && (
              <div className="absolute inset-0 z-0 rounded-lg pointer-events-none">
                <div className={`absolute bottom-[-1px] left-0 right-0 h-1/2 ${gradientClasses.base}`} />
                <div
                  className={`absolute bottom-[-1px] left-0 right-0 h-1/2 ${gradientClasses.hover
                    } opacity-0 group-hover:opacity-50 transition-opacity duration-300`}
                />
              </div>
            )}

            <div className="absolute bottom-0 left-0 z-10 p-3 pt-6 pointer-events-none">
              <h3 className="font-medium text-white text-md line-clamp-2 transform transition-transform duration-300 origin-left group-hover:scale-[1.1]">
                {item?.title}
              </h3>
            </div>

            {/* Removed Continue Watching button as per user request */}


            {/* Remove the blocking button for isMoreLikeThis to allow context menu clicks */}
            {/* {isMoreLikeThis && (
              <button
                className="absolute inset-0 z-20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
                onClick={handleCardClick}
                aria-label={`View ${item?.title} details`}
              />
            )} */}
          </div>
        </div>
      </div>

      {currentModalItem && !isFullscreen && (
        <ContentModal
          isOpen={true}
          onClose={(open) => !open && setCurrentModalItem(null)}
          item={actualItem}
          variant={contentType}
          isKidsMode={effectiveKidsMode}
          autoDetectKids={false}
          isSaved={isSaved}
          onSave={handleSaveModal}
          onPlayEpisode={handlePlayEpisode}
          videoUrl={videoUrl}
          movieId={actualItem.id}
          contentItem={contentItem}
          channel={channel}
          recommendedContent={recommendedContent}
          onOpenRelatedItem={setCurrentModalItem}
          skipContentFiltering={isMoreLikeThis}
          allowNestedModals={effectiveKidsMode}
        />
      )}
    </>
  );
}

export default ContentCard;