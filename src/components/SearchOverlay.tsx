
import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { mockMovies } from "@/data/mockMovies";
import MovieCard from "./MovieCard";
import ChannelCard from "./ChannelCard";
import SeriesCard from "./SeriesCard";
import FullscreenPlayer from "./FullscreenPlayer";
import { useUserSubscriptions } from "@/hooks/useUserSubscriptions";
import ChannelModal from "./ChannelModal";
import MovieModal from "./MovieModal";
import SeriesModal from "./SeriesModal";
import MovieHoverRow from "./MovieHoverRow";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery?: string;
  movieResults?: any[];
  seriesResults?: any[];
  channelResults?: any[];
}

const SearchOverlay = ({ isOpen, onClose, searchQuery = "", movieResults = [], seriesResults = [], channelResults = [] }: SearchOverlayProps) => {
  const { subscriptionIds, toggleSubscription } = useUserSubscriptions();
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [selectedSeries, setSelectedSeries] = useState<any>(null);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  // Hide navbar when any modal or fullscreen is open
  useEffect(() => {
    const navbar = document.querySelector('nav');
    if ((selectedChannel || selectedMovie || selectedSeries || fullscreenOpen) && navbar) {
      navbar.style.display = 'none';
    } else if (navbar) {
      navbar.style.display = '';
    }
    return () => { if (navbar) navbar.style.display = ''; };
  }, [selectedChannel, selectedMovie, selectedSeries, fullscreenOpen]);

  const handleChannelClick = (channel: any) => setSelectedChannel(channel);
  const handleCloseChannelModal = () => setSelectedChannel(null);

  if (!isOpen) return null;

  const hasResults = movieResults.length > 0 || seriesResults.length > 0 || channelResults.length > 0;

  return (
    <div className="fixed left-0 right-0 z-50 bg-gradient-to-t from-black via-brand-800 to-brand-500" style={{ top: '64px', height: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div className="sticky top-0 bg-black/20 backdrop-blur-sm p-4 z-50">
        <div className="max-w-7xl mx-auto flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search movies, series, channels..."
              value={searchQuery}
              readOnly
              className="bg-black/20 backdrop-blur-md border border-transparent rounded-lg pl-12 pr-4 py-3 w-full focus:outline-none focus:border-brand-500 focus:shadow-[0_0_0_3px_rgba(253,121,35,0.3)] transition-all duration-200 text-white"
            />
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            style={{ position: 'absolute', right: 32, top: 24 }}
            aria-label="Close search overlay"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Search Results - scrollable, no visible scrollbar */}
      <div className="max-w-7xl mx-auto px-4 py-8 overflow-y-auto scrollbar-hide" style={{ maxHeight: 'calc(100vh - 64px - 80px)' }}>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">
            {searchQuery ? `Results for "${searchQuery}"` : 'Browse All Content'}
          </h2>
        </div>
        {!hasResults && (
          <div className="text-gray-400 text-lg">No results found.</div>
        )}
        {channelResults.length > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl font-semibold text-white mb-3">Channels</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {channelResults.map((channel) => (
                <div key={channel.id} onClick={() => handleChannelClick(channel)} className="cursor-pointer">
                  <ChannelCard 
                    channel={channel} 
                    isSubscribed={subscriptionIds.includes(channel.id)}
                    onSubscribe={toggleSubscription}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        {movieResults.length > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl font-semibold text-white mb-3">Movies</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {movieResults.map((movie) => (
                <div key={movie.id} className="group hover:scale-105 transition-transform duration-200">
                  <MovieCard movie={movie} />
                </div>
              ))}
            </div>
          </div>
        )}
        {seriesResults.length > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl font-semibold text-white mb-3">TV Shows</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {seriesResults.map((series) => (
                <div key={series.id} className="group hover:scale-105 transition-transform duration-200">
                  <SeriesCard series={series} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Channel Modal */}
      {selectedChannel && (
        <ChannelModal
          isOpen={!!selectedChannel}
          onClose={handleCloseChannelModal}
          channel={selectedChannel}
        />
      )}
    </div>
  );
};

export default SearchOverlay;
