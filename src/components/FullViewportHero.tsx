import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { useAuth } from '@/contexts/AuthContext';
import { Play, Info, ArrowLeft, ArrowRight } from 'lucide-react';
import MovieModal from './MovieModal';
import SeriesModal from './SeriesModal';
import FullscreenPlayer from './FullscreenPlayer';
import ChannelCard from './ChannelCard';
import { Channel } from "@/data/mockMovies";

export interface HeroCarouselItem {
  id: string;
  title: string;
  description: string | null;
  posterUrl?: string | null;
  videoUrl?: string | null;
  type?: 'movie' | 'series';
  genre?: string;
  year?: number;
  rating?: number;
  channelId?: string;
  seasons_data?: any;
}

interface FullViewportHeroProps {
  items: HeroCarouselItem[];
  allContent: HeroCarouselItem[];
  channels: Channel[];
  onChannelClick: (channel: any) => void;
  subscriptionIds: string[];
  onSubscribe: (channelId: string) => void;
}

const FullViewportHero: React.FC<FullViewportHeroProps> = ({
                                                             items,
                                                             allContent,
                                                             channels,
                                                             onChannelClick,
                                                             subscriptionIds,
                                                             onSubscribe
                                                           }) => {
  const { isLoggedIn, setShowLoginModal } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'movie' | 'series' | null>(null);
  const [modalItem, setModalItem] = useState<HeroCarouselItem | null>(null);
  const [recommendedContent, setRecommendedContent] = useState<HeroCarouselItem[]>([]);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [fullscreenUrl, setFullscreenUrl] = useState<string | null>(null);
  const [fullscreenTitle, setFullscreenTitle] = useState<string | null>(null);

  // Play video in fullscreen
  const handlePlay = (item: HeroCarouselItem) => {
    if (item.type === 'series') {
      let videoUrl = '';
      let title = item.title;
      let seasonsData = item.seasons_data;
      if (seasonsData) {
        if (typeof seasonsData === 'string') {
          try {
            seasonsData = JSON.parse(seasonsData);
          } catch {}
        }
        if (Array.isArray(seasonsData) && seasonsData.length > 0 && seasonsData[0].episodes && seasonsData[0].episodes.length > 0) {
          videoUrl = seasonsData[0].episodes[0].videoUrl || seasonsData[0].episodes[0].video_url;
          title = `${item.title} - ${seasonsData[0].episodes[0].title}`;
        }
      }
      if (videoUrl) {
        setFullscreenUrl(videoUrl);
        setFullscreenTitle(title);
        setFullscreenOpen(true);
      }
      return;
    }
    if (!item.videoUrl) return;
    setFullscreenUrl(item.videoUrl);
    setFullscreenTitle(item.title);
    setFullscreenOpen(true);
  };

  // Open modal for more info
  const handleMoreInfo = (item: HeroCarouselItem) => {
    setModalType(item.type || 'movie');
    setModalItem(item);
    const recs = allContent.filter(
        c => c.id !== item.id && (c.genre === item.genre || c.channelId === item.channelId)
    ).slice(0, 6);
    setRecommendedContent(recs);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setModalItem(null);
    setModalType(null);
    setRecommendedContent([]);
  };

  const handleCloseFullscreen = () => {
    setFullscreenOpen(false);
    setFullscreenUrl(null);
    setFullscreenTitle(null);
  };

  // Channel scroll functions
  const scrollChannelsLeft = () => {
    const container = document.getElementById('channels-container');
    if (container) {
      container.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollChannelsRight = () => {
    const container = document.getElementById('channels-container');
    if (container) {
      container.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  return (
      <div className="relative w-full h-screen overflow-hidden">
        {/* Main Hero Carousel */}
        <div className="absolute inset-0">
          <Swiper
              modules={[Navigation, Autoplay, Pagination]}
              slidesPerView={1}
              navigation={{
                prevEl: '.hero-prev',
                nextEl: '.hero-next',
              }}
              pagination={{
                clickable: true,
                bulletClass: 'swiper-pagination-bullet-hero',
                bulletActiveClass: 'swiper-pagination-bullet-hero-active',
              }}
              autoplay={{ delay: 6000, disableOnInteraction: false }}
              loop={true}
              className="h-full w-full"
          >
            {items.map((slide, idx) => (
                <SwiperSlide key={slide.id || idx}>
                  <div className="relative w-full h-full">
                    {/* Background Image */}
                    <div
                        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
                        style={{
                          backgroundImage: `url(${slide.posterUrl || '/placeholder.svg'})`,
                        }}
                    />

                    {/* Gradient Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

                    {/* Content */}
                    <div className="relative z-10 flex flex-col justify-center h-full px-8 md:px-16 lg:px-24 max-w-4xl">
                      <div className="space-y-6">
                        {/* Movie Title */}
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
                          {slide.title}
                        </h1>

                        {/* Description */}
                        {slide.description && (
                            <p className="text-lg md:text-xl text-gray-200 max-w-2xl leading-relaxed">
                              {slide.description}
                            </p>
                        )}

                        {/* Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                          {isLoggedIn ? (
                              <>
                                <button
                                    className="flex items-center justify-center gap-3 bg-white text-black px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-200 transition-all duration-200 shadow-lg min-w-[140px]"
                                    onClick={() => handlePlay(slide)}
                                    disabled={!slide.videoUrl && slide.type !== 'series'}
                                >
                                  <Play className="w-6 h-6 fill-current" />
                                  Play
                                </button>
                                <button
                                    className="flex items-center justify-center gap-3 bg-gray-600/80 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-500/80 transition-all duration-200 backdrop-blur-sm border border-gray-500/50"
                                    onClick={() => handleMoreInfo(slide)}
                                >
                                  <Info className="w-6 h-6" />
                                  More Info
                                </button>
                              </>
                          ) : (
                              <button
                                  className="flex items-center justify-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition-all duration-200 shadow-lg min-w-[140px]"
                                  onClick={() => setShowLoginModal(true)}
                              >
                                Sign Up
                              </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
            ))}
          </Swiper>

          {/* Navigation Arrows */}
          <button className="hero-prev absolute left-8 top-1/2 transform -translate-y-1/2 z-30 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 backdrop-blur-sm">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button className="hero-next absolute right-8 top-1/2 transform -translate-y-1/2 z-30 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 backdrop-blur-sm">
            <ArrowRight className="w-6 h-6" />
          </button>

          {/* Bottom Gradient Transition */}
          <div className="absolute bottom-0 left-0 right-0 z-15 h-32 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent pointer-events-none" />
        </div>

        {/* Bottom Channels Section */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
          <div className="px-8 py-6">
            {/* Channels Header */}
            <div className="mb-4">
              <h2 className="text-white text-xl md:text-2xl font-bold">Top Channels</h2>
            </div>

            {/* Channels Scrollable Row with Side Navigation */}
            <div className="relative">
              {/* Left Arrow */}
              <button
                  onClick={scrollChannelsLeft}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 z-30 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 backdrop-blur-sm"
                  style={{ marginLeft: '-20px' }}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* Right Arrow */}
              <button
                  onClick={scrollChannelsRight}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 z-30 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 backdrop-blur-sm"
                  style={{ marginRight: '-20px' }}
              >
                <ArrowRight className="w-5 h-5" />
              </button>

              {/* Channels Container */}
              <div
                  id="channels-container"
                  className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {channels.map((channel) => (
                    <div key={channel.id} className="flex-shrink-0 w-64">
                      <div onClick={() => onChannelClick(channel)}>
                        <ChannelCard
                            channel={channel}
                            isSubscribed={subscriptionIds.includes(channel.id)}
                            onSubscribe={onSubscribe}
                        />
                      </div>
                    </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Fullscreen Player */}
        {fullscreenOpen && fullscreenUrl && (
            <FullscreenPlayer
                isOpen={fullscreenOpen}
                onClose={handleCloseFullscreen}
                videoUrl={fullscreenUrl}
                title={fullscreenTitle || ''}
            />
        )}

        {/* Modals */}
        {modalOpen && modalType === 'movie' && modalItem && (
            <MovieModal
                isOpen={modalOpen}
                onClose={handleCloseModal}
                movie={modalItem as any}
                isSaved={false}
                onSave={() => {}}
                onPlay={() => handlePlay(modalItem)}
                videoUrl={modalItem.videoUrl}
                contentItem={modalItem}
                channel={null}
                recommendedContent={recommendedContent}
            />
        )}
        {modalOpen && modalType === 'series' && modalItem && (
            <SeriesModal
                isOpen={modalOpen}
                onClose={handleCloseModal}
                series={modalItem as any}
                isSaved={false}
                onSave={() => {}}
                onPlayEpisode={(url, episodeTitle) => {
                  setFullscreenUrl(url);
                  setFullscreenTitle(episodeTitle);
                  setFullscreenOpen(true);
                }}
                videoUrl={modalItem.videoUrl}
                contentItem={modalItem}
                channel={null}
                recommendedContent={recommendedContent}
            />
        )}

        {/* Custom Pagination Styles */}
        <style jsx>{`
          .swiper-pagination-bullet-hero {
            width: 12px;
            height: 12px;
            background: rgba(255, 255, 255, 0.5);
            opacity: 1;
            margin: 0 6px;
            transition: all 0.3s ease;
          }
          .swiper-pagination-bullet-hero-active {
            background: white;
            transform: scale(1.2);
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
  );
};

export default FullViewportHero;