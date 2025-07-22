import { useState } from 'react';
import ChannelModal from "@/components/ChannelModal";
import FullViewportHero from "@/components/FullViewportHero";
import { useAppContent } from "@/hooks/useAppContent";
import { useUserSubscriptions } from "@/hooks/useUserSubscriptions";
import { useAuth } from "@/contexts/AuthContext";
import HomeRow from "@/components/HomeRow";
import { featuredContentIds } from '@/data/featuredContentIds';

const Index = () => {
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const { homeContent, channels, isLoading, content } = useAppContent();
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
      <div className="bg-gray-900 pt-16 relative">
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black to-gray-900 pointer-events-none" />

        <div className="max-w-full ">
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
