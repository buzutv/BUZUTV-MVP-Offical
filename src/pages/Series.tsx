import { useState } from "react";
import SeriesCard from "@/components/SeriesCard";
import MovieHoverRow from "@/components/MovieHoverRow";
import HeroBanner from "@/components/HeroBanner";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAppContent } from "@/hooks/useAppContent";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import SeriesModal from "@/components/SeriesModal";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import { useContent } from "@/hooks/useContent";
import { useChannels } from "@/hooks/useChannels";
import FullscreenPlayer from "@/components/FullscreenPlayer";

const Series = () => {
  const { seriesContent, isLoading } = useAppContent();
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenVideoUrl, setFullscreenVideoUrl] = useState("");
  const [fullscreenVideoTitle, setFullscreenVideoTitle] = useState("");
  const { favoriteIds, addToFavorites, removeFromFavorites } =
    useUserFavorites();
  const { content } = useContent();
  const { channels } = useChannels();

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <div className="text-2xl">Loading...</div>
        </div>
      </ProtectedRoute>
    );
  }

  const SeriesRow = ({
    title,
    series,
  }: {
    title: string;
    series: typeof seriesContent.all;
  }) => (
    <section className="mb-8 px-4">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <Carousel
        opts={{
          align: "start",
          skipSnaps: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-1">
          <MovieHoverRow className="flex">
            {series.map((show) => (
              <CarouselItem key={show.id} className="pl-1 basis-auto">
                <div className="w-64">
                  <SeriesCard series={show} />
                </div>
              </CarouselItem>
            ))}
          </MovieHoverRow>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </section>
  );

  return (
    <ProtectedRoute>
      {/* Fixed background gradient */}
      <div className="fixed inset-0 bg-gradient-to-t from-black via-brand-800 to-brand-500"></div>

      <div className="relative min-h-screen text-white">
        {/* Removed Navbar */}

        <div className="pt-16">
          {seriesContent.all.length > 0 ? (
            <>
              <div className="max-w-full px-2 py-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-6 px-4">
                  <div className="lg:col-span-2">
                    <HeroBanner
                      movies={
                        seriesContent.featured.length > 0
                          ? seriesContent.featured
                          : seriesContent.all.slice(0, 3)
                      }
                    />
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold mb-3">
                      Top Ranked Series
                    </h2>
                    <div
                      className="flex flex-col space-y-2 w-full"
                      style={{ height: "calc(60vh - 2rem)" }}
                    >
                      {seriesContent.topRanked
                        .slice(0, 5)
                        .map((show, index) => (
                          <div
                            key={show.id}
                            className="relative flex items-center bg-gray-800 rounded-lg shadow-lg p-2 group border-2 border-transparent hover:border-blue-500 hover:border-opacity-80 min-h-[60px] h-[calc((60vh-2rem)/5-0.5rem)] cursor-pointer"
                            onClick={() => setSelectedSeries(show)}
                          >
                            {/* Ranking Badge */}
                            <div className="absolute -left-6 top-1/2 -translate-y-1/2 z-10">
                              <span className="bg-blue-600 text-white text-base font-bold px-3 py-1 rounded-full shadow-lg border-4 border-gray-900">
                                #{index + 1}
                              </span>
                            </div>
                            {/* Poster Image */}
                            <img
                              src={show.posterUrl}
                              alt={show.title}
                              className="w-16 h-20 object-cover rounded-lg mr-3 flex-shrink-0 border-2 border-gray-700"
                            />
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-white text-base mb-0.5 line-clamp-1">
                                {show.title}
                              </h3>
                              <div className="flex items-center space-x-2 text-xs text-gray-300 mb-0.5">
                                <span>{show.year}</span>
                                <span>•</span>
                                <span className="flex items-center">
                                  <span className="text-yellow-400">★</span>{" "}
                                  {show.rating}
                                </span>
                              </div>
                              <span className="inline-block bg-black/60 text-xs text-white px-2 py-0.5 rounded">
                                {show.genre}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                    {selectedSeries &&
                      (() => {
                        // Match SeriesCard modal logic
                        const isSaved = favoriteIds.includes(selectedSeries.id);
                        const contentItem = content.find(
                          (item) => item.id === selectedSeries.id,
                        );
                        const videoUrl = contentItem?.video_url;
                        const channel = channels.find(
                          (ch) => ch.id === selectedSeries.channelId,
                        );
                        const recommendedContent = content
                          .filter(
                            (item) =>
                              item.id !== selectedSeries.id &&
                              (item.genre === selectedSeries.genre ||
                                item.channel_id === selectedSeries.channelId),
                          )
                          .slice(0, 6);
                        const handleSaveModal = () => {
                          if (isSaved) {
                            removeFromFavorites(selectedSeries.id);
                          } else {
                            addToFavorites(selectedSeries.id);
                          }
                        };
                        const handlePlayEpisode = (
                          videoUrl: string,
                          episodeTitle: string,
                        ) => {
                          setFullscreenVideoUrl(videoUrl);
                          setFullscreenVideoTitle(episodeTitle);
                          setIsFullscreen(true);
                        };
                        const handleExitFullscreen = () => {
                          setIsFullscreen(false);
                          setFullscreenVideoUrl("");
                          setFullscreenVideoTitle("");
                        };
                        return (
                          <>
                            {isFullscreen && fullscreenVideoUrl && (
                              <FullscreenPlayer
                                isOpen={isFullscreen}
                                onClose={handleExitFullscreen}
                                videoUrl={fullscreenVideoUrl}
                                title={fullscreenVideoTitle}
                              />
                            )}
                            <SeriesModal
                              isOpen={!!selectedSeries && !isFullscreen}
                              onClose={() => setSelectedSeries(null)}
                              series={selectedSeries}
                              isSaved={isSaved}
                              onSave={handleSaveModal}
                              onPlayEpisode={handlePlayEpisode}
                              videoUrl={videoUrl}
                              contentItem={contentItem}
                              channel={channel}
                              recommendedContent={recommendedContent}
                            />
                          </>
                        );
                      })()}
                  </div>
                </div>
              </div>

              <div className="max-w-full pb-4">
                <SeriesRow
                  title="New TV Shows"
                  series={
                    seriesContent.new.length > 0
                      ? seriesContent.new
                      : seriesContent.all.slice(0, 20)
                  }
                />
                <SeriesRow
                  title="Continue Watching"
                  series={
                    seriesContent.recommended.length > 0
                      ? seriesContent.recommended.slice(0, 15)
                      : seriesContent.all.slice(5, 20)
                  }
                />
                <SeriesRow
                  title="Recommended"
                  series={
                    seriesContent.recommended.length > 0
                      ? seriesContent.recommended
                      : seriesContent.all.slice(10, 30)
                  }
                />
                <SeriesRow
                  title="Comedy"
                  series={
                    seriesContent.byGenre.Comedy?.length > 0
                      ? seriesContent.byGenre.Comedy
                      : seriesContent.all
                          .filter((s) =>
                            s.genre?.toLowerCase().includes("comedy"),
                          )
                          .slice(0, 20) || seriesContent.all.slice(15, 35)
                  }
                />
                <SeriesRow
                  title="Drama"
                  series={
                    seriesContent.byGenre.Drama?.length > 0
                      ? seriesContent.byGenre.Drama
                      : seriesContent.all
                          .filter((s) =>
                            s.genre?.toLowerCase().includes("drama"),
                          )
                          .slice(0, 20) || seriesContent.all.slice(20, 40)
                  }
                />
                <SeriesRow
                  title="Sports"
                  series={
                    seriesContent.byGenre.Sports?.length > 0
                      ? seriesContent.byGenre.Sports
                      : seriesContent.all
                          .filter((s) =>
                            s.genre?.toLowerCase().includes("sport"),
                          )
                          .slice(0, 20) || seriesContent.all.slice(25, 45)
                  }
                />
                <SeriesRow
                  title="Romance"
                  series={
                    seriesContent.byGenre.Romance?.length > 0
                      ? seriesContent.byGenre.Romance
                      : seriesContent.all
                          .filter((s) =>
                            s.genre?.toLowerCase().includes("romance"),
                          )
                          .slice(0, 20) || seriesContent.all.slice(30, 50)
                  }
                />
                <SeriesRow
                  title="Action"
                  series={
                    seriesContent.byGenre.Action?.length > 0
                      ? seriesContent.byGenre.Action
                      : seriesContent.all
                          .filter((s) =>
                            s.genre?.toLowerCase().includes("action"),
                          )
                          .slice(0, 20) || seriesContent.all.slice(35, 55)
                  }
                />
                <SeriesRow
                  title="Lifestyle"
                  series={
                    seriesContent.byGenre.Lifestyle?.length > 0
                      ? seriesContent.byGenre.Lifestyle
                      : seriesContent.all
                          .filter((s) =>
                            s.genre?.toLowerCase().includes("lifestyle"),
                          )
                          .slice(0, 20) || seriesContent.all.slice(40, 60)
                  }
                />
                <SeriesRow
                  title="Documentary"
                  series={
                    seriesContent.byGenre.Documentary?.length > 0
                      ? seriesContent.byGenre.Documentary
                      : seriesContent.all
                          .filter((s) =>
                            s.genre?.toLowerCase().includes("documentary"),
                          )
                          .slice(0, 20) || seriesContent.all.slice(45, 65)
                  }
                />
                <SeriesRow
                  title="Informational"
                  series={
                    seriesContent.byGenre.Informational?.length > 0
                      ? seriesContent.byGenre.Informational
                      : seriesContent.all
                          .filter((s) =>
                            s.genre?.toLowerCase().includes("informational"),
                          )
                          .slice(0, 20) || seriesContent.all.slice(50, 70)
                  }
                />
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <h2 className="text-2xl font-bold mb-4">No series available</h2>
              <p className="text-gray-400">
                Series will appear here once they're added to the platform
              </p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Series;
