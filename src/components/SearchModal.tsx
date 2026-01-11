import React, { useEffect, useMemo, useState } from "react";
import { Search, X, Film, Tv, MonitorPlay } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import ContentCard from "@/components/ContentCard";
import ChannelCard, { Channel as ChannelType } from "@/components/ChannelCard";
import { useContent } from "@/hooks/useContent";
import { useChannels } from "@/hooks/useChannels";
import { Content } from "@/types"; // Ensure this import matches your types.ts
import ChannelModal from "@/components/ChannelModal";
import ContentModal from "@/components/ContentModal";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import FullscreenPlayer from "@/components/FullscreenPlayer";
import { useAuth } from "@/contexts/AuthContext";

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SearchModal = ({ isOpen, onClose }: SearchModalProps) => {
    const { content } = useContent();
    const { channels } = useChannels();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedChannel, setSelectedChannel] = useState<ChannelType | null>(
        null
    );
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [fullscreenVideoUrl, setFullscreenVideoUrl] = useState("");
    const [fullscreenVideoTitle, setFullscreenVideoTitle] = useState("");

    const { favoriteIds, addToFavorites, removeFromFavorites } = useUserFavorites();
    const { user } = useAuth(); // Needed for FullscreenPlayer

    // Reset state when closed
    useEffect(() => {
        if (!isOpen) {
            setSearchQuery("");
            setSelectedItem(null);
            setSelectedChannel(null);
        }
    }, [isOpen]);

    const searchResults = useMemo(() => {
        if (!searchQuery.trim())
            return { channels: [], movies: [], series: [], kids: [] };

        const query = searchQuery.toLowerCase().trim();

        const channelResults = channels.filter(
            (channel) =>
                channel.name.toLowerCase().includes(query) ||
                channel.description?.toLowerCase().includes(query) ||
                channel.genre?.toLowerCase().includes(query)
        );

        const contentResults = content.filter((item) => {
            const titleMatch = item.title.toLowerCase().includes(query);
            const genreMatch = item.genre?.toLowerCase().includes(query);
            const channelName = channels
                .find((ch) => ch.id === item.channel_id)
                ?.name.toLowerCase();
            const channelMatch = channelName?.includes(query);

            return titleMatch || genreMatch || channelMatch;
        });

        const movies = contentResults.filter((item) => item.type === "movie");
        const series = contentResults.filter((item) => item.type === "series");

        // Assuming kids content is a type or a flag, adapting based on usage
        // If 'kids' is not a dedicated type string in your DB, this might need adjustment.
        // Based on previous code, it seemed to filter by type="kids" or is_kids=true
        const kids = contentResults.filter((item) => item.type === "kids" || (item.is_kids && item.type === "movie"));

        return {
            channels: channelResults,
            movies,
            series,
            kids,
        };
    }, [searchQuery, content, channels]);

    const formattedResults = useMemo(() => {
        const formatContentItem = (item: any) => ({
            ...item,
            posterUrl: item.poster_url || "/placeholder.svg",
            // Ensure required properties for ContentCard/Modal exist
            description: item.description || "",
        });

        return {
            channels: searchResults.channels.map((ch) => ({
                id: ch.id,
                name: ch.name,
                logoUrl: ch.logo_url || "/placeholder.svg",
                description: ch.description,
                genre: ch.genre || "", // Fix for 'genre does not exist' if it's used
                contentCount: 0,
            })),
            movies: searchResults.movies.map(formatContentItem),
            series: searchResults.series.map(formatContentItem),
            kids: searchResults.kids.map(formatContentItem),
        };
    }, [searchResults]);

    const handleChannelClick = (channel: any) => {
        setSelectedChannel(channel);
    };

    const handleContentClick = (item: any) => {
        setSelectedItem(item);
    };

    const handleCloseChannelModal = () => {
        setSelectedChannel(null);
    };

    const handleCloseContentModal = () => {
        setSelectedItem(null);
    };

    // Handlers for ContentModal
    const handleSaveModal = () => {
        if (!selectedItem) return;
        if (favoriteIds.includes(selectedItem.id)) {
            removeFromFavorites(selectedItem.id);
        } else {
            addToFavorites(selectedItem.id);
        }
    };

    const handlePlayMovie = () => {
        const item = content.find(c => c.id === selectedItem?.id);
        if (item?.video_url) {
            setFullscreenVideoUrl(item.video_url);
            setFullscreenVideoTitle(selectedItem.title);
            setIsFullscreen(true);
        }
    };

    const handlePlayEpisode = (url: string, title: string) => {
        setFullscreenVideoUrl(url);
        setFullscreenVideoTitle(title);
        setIsFullscreen(true);
    };

    const handleExitFullscreen = () => {
        setIsFullscreen(false);
        setFullscreenVideoUrl("");
        setFullscreenVideoTitle("");
    };

    const hasResults =
        formattedResults.channels.length > 0 ||
        formattedResults.movies.length > 0 ||
        formattedResults.series.length > 0 ||
        formattedResults.kids.length > 0;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[90vw] w-full h-[85vh] p-0 bg-black/95 border-white/10 backdrop-blur-xl gap-0 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center gap-4 px-6 py-4 border-b border-white/10 shrink-0">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                        autoFocus
                        className="flex-1 bg-transparent border-none text-xl text-white placeholder:text-gray-500 font-medium outline-none"
                        placeholder="Search movies, TV shows, channels..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {/* Close button is handled by DialogPrimitive internally usually, but we can add explicit one or rely on X */}
                </div>

                <ScrollArea className="flex-1">
                    <div className="px-6 py-8">
                        {!searchQuery ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                <Search className="w-16 h-16 mb-4 opacity-20" />
                                <p className="text-xl font-medium">Search for content</p>
                            </div>
                        ) : !hasResults ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                    <Search className="w-8 h-8 opacity-40" />
                                </div>
                                <p className="text-xl">No results found for "{searchQuery}"</p>
                            </div>
                        ) : (
                            <div className="space-y-12 pb-20">
                                {/* Channels */}
                                {formattedResults.channels.length > 0 && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="flex items-center gap-2 text-xl font-bold text-white mb-4">
                                            <MonitorPlay className="w-5 h-5 text-brand-500" />
                                            <h2>Channels</h2>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                            {formattedResults.channels.map((channel) => (
                                                <div
                                                    key={channel.id}
                                                    onClick={() => handleChannelClick(channel)}
                                                    className="cursor-pointer transition-transform hover:scale-105"
                                                >
                                                    <ChannelCard channel={channel} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Movies */}
                                {formattedResults.movies.length > 0 && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                                        <div className="flex items-center gap-2 text-xl font-bold text-white mb-4">
                                            <Film className="w-5 h-5 text-brand-500" />
                                            <h2>Movies</h2>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                            {formattedResults.movies.map((movie) => (
                                                <div key={movie.id} className="group hover:scale-105 transition-transform duration-200">
                                                    <ContentCard
                                                        item={movie}
                                                        variant="movie"
                                                        autoDetectKids={true}
                                                        onItemClick={(item) => handleContentClick(item)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Series */}
                                {formattedResults.series.length > 0 && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                                        <div className="flex items-center gap-2 text-xl font-bold text-white mb-4">
                                            <Tv className="w-5 h-5 text-brand-500" />
                                            <h2>TV Shows</h2>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                            {formattedResults.series.map((series) => (
                                                <div key={series.id} className="group hover:scale-105 transition-transform duration-200">
                                                    <ContentCard
                                                        item={series}
                                                        variant="series"
                                                        autoDetectKids={true}
                                                        onItemClick={(item) => handleContentClick(item)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>

            {/* Render modals OUTSIDE DialogContent to ensure they stack on top if they use Portals, 
          which they likely do given they are based on Radix Dialog or similar. 
          If they don't, being later in DOM helps. */}

            <ChannelModal
                isOpen={!!selectedChannel}
                onClose={handleCloseChannelModal}
                channel={selectedChannel}
            />

            {!!selectedItem && (
                <ContentModal
                    isOpen={!!selectedItem && !isFullscreen}
                    onClose={(open) => !open && handleCloseContentModal()}
                    item={selectedItem}
                    variant={selectedItem.type || 'movie'}
                    autoDetectKids={true}
                    isSaved={favoriteIds.includes(selectedItem.id)}
                    onSave={handleSaveModal}
                    onPlay={selectedItem.type === 'movie' ? handlePlayMovie : undefined}
                    onPlayEpisode={selectedItem.type === 'series' ? handlePlayEpisode : undefined}
                    // Pass minimal required props, content modal fetches details internally mostly
                    videoUrl={content.find(c => c.id === selectedItem.id)?.video_url}
                    contentItem={content.find(c => c.id === selectedItem.id)}
                />
            )}

            {isFullscreen && (
                <FullscreenPlayer
                    isOpen={isFullscreen}
                    onClose={handleExitFullscreen}
                    videoUrl={fullscreenVideoUrl}
                    title={fullscreenVideoTitle}
                    userId={user?.id || ''}
                    type={selectedItem?.type || 'movie'}
                    movieId={selectedItem?.id}
                />
            )}

        </Dialog>
    );
};

export default SearchModal;
