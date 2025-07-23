import { useState } from 'react';
import ChannelModal from "@/components/ChannelModal";
import FullViewportHero from "@/components/FullViewportHero";
import FilterBar from "@/components/FilterBar";
import ContentGrid from "@/components/ContentGrid";
import { useAppContent } from "@/hooks/useAppContent";
import { useUserSubscriptions } from "@/hooks/useUserSubscriptions";
import { useAuth } from "@/contexts/AuthContext";
import HomeRow from "@/components/HomeRow";
import { featuredContentIds } from '@/data/featuredContentIds';
import { genres } from '@/data/mockMovies';

const Index = () => {
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [activeGenre, setActiveGenre] = useState('all');
  
  const { homeContent, channels, isLoading, content, kidsContent } = useAppContent();
  const { subscriptionIds, toggleSubscription } = useUserSubscriptions();
  const { isLoggedIn, setShowLoginModal } = useAuth();

  // Build featured array from full content objects
  const featured = featuredContentIds
    .map(id => content.allContent.find(item => item.id === id))
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
    if (activeGenre === 'all') {
      return content.allContent;
    }
    
    // Filter by genre
    return content.allContent.filter(item => 
      item.genre.toLowerCase() === activeGenre.toLowerCase()
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
    <div className="min-h-screen bg-gray-900 text-white">
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
      <div className="bg-gray-900 pt-8 relative">
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black to-gray-900 pointer-events-none" />

        {/* Filter Bar */}
        <div className="mb-4">
          <FilterBar 
            activeGenre={activeGenre}
            onGenreChange={handleGenreChange}
            availableGenres={genres}
          />
        </div>

        <div className="max-w-full px-4 sm:px-6 lg:px-8 py-8">
          {activeGenre === 'all' ? (
            // Show original layout with content rows when "All" is selected
            <>

              {/* Show content only if we have any */}
              {Object.values(homeContent).some(arr => arr.length > 0) ? (
                <>
                  {/* Content Rows - using pre-computed categories */}
                  {homeContent.trending.length > 0 && (
                    <HomeRow title="Trending Now" items={homeContent.trending} onCardClick={handleHomeRowCardClick} />
                  )}
                  {homeContent.action.length > 0 && (
                    <HomeRow title="Action" items={homeContent.action} onCardClick={handleHomeRowCardClick} />
                  )}
                  {homeContent.drama.length > 0 && (
                    <HomeRow title="Drama" items={homeContent.drama} onCardClick={handleHomeRowCardClick} />
                  )}
                  {homeContent.romance.length > 0 && (
                    <HomeRow title="Romance" items={homeContent.romance} onCardClick={handleHomeRowCardClick} />
                  )}
                  {homeContent.comedy.length > 0 && (
                    <HomeRow title="Comedy" items={homeContent.comedy} onCardClick={handleHomeRowCardClick} />
                  )}
                  {homeContent.documentary.length > 0 && (
                    <HomeRow title="Documentary" items={homeContent.documentary} onCardClick={handleHomeRowCardClick} />
                  )}
                  {homeContent.informational.length > 0 && (
                      <HomeRow title="Informational" items={homeContent.informational} onCardClick={handleHomeRowCardClick} />
                  )}
                </>
              ) : (
                <div className="text-center py-16">
                  <h2 className="text-2xl font-bold mb-4">No content available</h2>
                  <p className="text-gray-400">Content will appear here once it's added to the platform</p>
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
              <div className="mt-8  px-4">
                <h2 className="text-xl font-semibold mb-4">
                  All Content
                </h2>
                
                {filteredContent.length > 0 ? (
                  <ContentGrid items={filteredContent} onCardClick={handleHomeRowCardClick} />
                ) : (
                  <div className="text-center py-16">
                    <h3 className="text-xl font-bold mb-2">No content found</h3>
                    <p className="text-gray-400">No {activeGenre} content available at the moment</p>
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
  );
};

export default Index;