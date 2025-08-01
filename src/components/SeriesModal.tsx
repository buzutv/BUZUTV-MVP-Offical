import { useState } from "react";
import { Heart, Play, Star } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Movie } from "@/data/mockMovies";
import HomeRow from "@/components/HomeRow";
import BrandButton from "@/components/ui/BrandButton";
import SeriesPlayer from "@/components/SeriesPlayer";

interface Episode {
  id: string;
  title: string;
  episode_number: number;
  duration_minutes?: number;
  description?: string;
  video_url?: string;
}

interface Season {
  season_number: number;
  episodes: Episode[];
}

interface SeriesModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  series: Movie;
  isSaved: boolean;
  onSave: () => void;
  onPlayEpisode: (videoUrl: string, episodeTitle: string) => void;
  videoUrl?: string;
  contentItem?: any;
  channel?: any;
  recommendedContent: any[];
  seasons?: Season[];
  onOpenRelatedSeries?: (item: Movie) => void;
  customBackground?: string;
}

const SeriesModal = ({
  isOpen,
  onClose,
  series,
  isSaved,
  onSave,
  onPlayEpisode,
  videoUrl,
  contentItem,
  channel,
  recommendedContent,
  seasons = [],
  onOpenRelatedSeries,
  customBackground,
}: SeriesModalProps) => {
  const [isSeriesPlayerOpen, setIsSeriesPlayerOpen] = useState(false);
  const [currentPlayingEpisode, setCurrentPlayingEpisode] =
    useState<Episode | null>(null);
  const [currentPlayingSeason, setCurrentPlayingSeason] = useState<number>(1);
  const formatDuration = (minutes: number | undefined) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ""}` : `${mins}m`;
  };

  const getSeasonsData = (): Season[] => {
    if (contentItem?.seasons_data) {
      try {
        let seasonsData =
          typeof contentItem.seasons_data === "string"
            ? JSON.parse(contentItem.seasons_data)
            : contentItem.seasons_data;

        if (Array.isArray(seasonsData) && seasonsData.length > 0) {
          return seasonsData.map((season: any) => ({
            season_number: season.seasonNumber,
            episodes: (season.episodes || []).map((episode: any) => ({
              id:
                episode.id ||
                `ep-${season.seasonNumber}-${episode.episodeNumber}`,
              title: episode.title,
              episode_number: episode.episodeNumber,
              duration_minutes: episode.duration_minutes || 45,
              description: episode.description,
              video_url: episode.videoUrl,
            })),
          }));
        }
      } catch (error) {
        console.error("Error parsing seasons_data:", error);
      }
    }
    return [];
  };

  const seasonsData = getSeasonsData();

  const handlePlayFirstEpisode = () => {
    const firstEpisode = seasonsData[0]?.episodes[0];
    if (firstEpisode?.video_url) {
      setCurrentPlayingEpisode(firstEpisode);
      setCurrentPlayingSeason(seasonsData[0].season_number);
      setIsSeriesPlayerOpen(true);
    }
  };

  const handlePlayEpisode = (episode: Episode) => {
    if (episode.video_url) {
      setCurrentPlayingEpisode(episode);
      // Find which season this episode belongs to
      const episodeSeason = seasonsData.find((season) =>
        season.episodes.some((ep) => ep.id === episode.id),
      );
      if (episodeSeason) {
        setCurrentPlayingSeason(episodeSeason.season_number);
      }
      setIsSeriesPlayerOpen(true);
    }
  };

  const handleCloseSeriesPlayer = () => {
    setIsSeriesPlayerOpen(false);
    setCurrentPlayingEpisode(null);
  };

  const showPlayButton =
    seasonsData.length > 0 && seasonsData[0]?.episodes?.length > 0;

  const filteredRecommendedContent = recommendedContent.filter((item) => {
    const passesId = item.id !== series.id;
    // If current series is kids content, show only kids content in recommendations
    // If current series is not kids content, exclude kids content from recommendations
    const passesKids =
      series.isKids || contentItem?.is_kids
        ? item.is_kids === true // Show only kids content
        : !item.is_kids; // Exclude kids content
    const passesGenre =
      item.genre === series.genre ||
      item.channel_id === series.channelId ||
      item.channel_id === contentItem?.channel_id;

    return passesId && passesKids && passesGenre;
  });

  const normalizedRecommendedContent = filteredRecommendedContent.map(
    (item) => ({
      ...item,
      posterUrl: item.posterUrl || item.poster_url,
    }),
  );

  const finalClassName = `max-w-full md:max-w-[75vw] max-h-full md:max-h-[90vh] text-white border-none p-0 overflow-hidden transition-all duration-700 ease-in-out opacity-0 scale-95 data-[state=open]:opacity-100 data-[state=open]:scale-100 ${customBackground ? customBackground : ""}`;
  const finalStyle = !customBackground
    ? {
        background: `
      linear-gradient(
        200deg,
        #311066 0%,   /* very dark violet */
        #1D0833 20%,  /* deep blackish purple */
        #120222 45%,  /* near-black violet */
        black 100%    /* pure black */
      )`,
      }
    : {};

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={finalClassName} style={finalStyle}>
          <DialogTitle className="sr-only">{series.title}</DialogTitle>
          <ScrollArea className="h-[90vh]">
            <div className="relative min-h-full">
              <div className="relative h-[60vh] overflow-hidden">
                <div className="absolute inset-0">
                  <img
                    src={series.posterUrl}
                    alt={series.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black via-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
                  <h1 className="text-5xl font-bold text-white mb-6">
                    {series.title}
                  </h1>
                  <div className="flex items-center space-x-4 mb-4">
                    {showPlayButton && (
                      <BrandButton
                        onClick={handlePlayFirstEpisode}
                        variant={
                          customBackground?.includes("kids")
                            ? "kids"
                            : "primary"
                        }
                        size="md"
                      >
                        <Play className="w-6 h-6 fill-current" />
                        <span>Play</span>
                      </BrandButton>
                    )}
                    <button
                      onClick={onSave}
                      className="bg-black/20 backdrop-blur-md text-white p-2 rounded-full transition-all duration-200 border border-brand-500/50 hover:border-brand-500 hover:bg-black/30"
                    >
                      <Heart
                        className={`w-5 h-5 ${isSaved ? "fill-current text-red-500" : ""}`}
                      />
                    </button>
                    {seasonsData.length > 0 && (
                      <span className="text-white text-xl font-medium">
                        {seasonsData.length} Season
                        {seasonsData.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-green-400 font-semibold">
                        {series.rating}
                      </span>
                    </div>
                    <span className="text-white font-medium">
                      {series.year}
                    </span>
                    <span className="border border-brand-500 px-2 py-0.5 text-xs text-gray-300 font-medium">
                      TV-MA
                    </span>
                    <span className="text-white">{series.genre}</span>
                    {channel?.logo_url && (
                      <div className="flex items-center">
                        <img
                          src={channel.logo_url}
                          alt={channel.name}
                          className="w-8 h-8 object-contain rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 md:p-8 pt-6 relative">
                <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-black to-transparent pointer-events-none" />
                {seasonsData.length > 0 && (
                  <div className="mb-8">
                    <Tabs defaultValue="season-1" className="w-full">
                      <TabsList className="grid w-full grid-cols-auto bg-transparent  transition-all duration-300 group">
                        {seasonsData.map((season) => (
                          <TabsTrigger
                            key={season.season_number}
                            value={`season-${season.season_number}`}
                            className={`
                              flex items-center justify-center gap-3 rounded-full font-medium will-change-transform transform-gpu transition-all whitespace-nowrap
                              px-4 py-2 text-base
                              ${
                                customBackground?.includes("kids")
                                  ? `
                                  data-[state=active]:bg-[linear-gradient(135deg,#1d4ed8,#2563eb,#3b82f6)]
                                  data-[state=active]:text-white
                                  data-[state=active]:border data-[state=active]:border-[rgba(37,99,235,0.3)]
                                  data-[state=active]:shadow-[0_10px_30px_rgba(37,99,235,0.4)]
                                  hover:shadow-[0_20px_50px_rgba(37,99,235,0.6)]
                                  data-[state=active]:hover:brightness-110
                                  hover:-translate-y-0.5
                                  transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]
                                  relative overflow-hidden
                                  before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full
                                  before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)]
                                  before:transition-[left] before:duration-500
                                  hover:before:left-full
                                  text-white border border-transparent
                                  hover:bg-blue-500/10 hover:backdrop-blur
                                `
                                  : `
                                  data-[state=active]:bg-[linear-gradient(135deg,#7c3aed,#8b5cf6,#a855f7)]
                                  data-[state=active]:text-white
                                  data-[state=active]:border-2 data-[state=active]:border-[rgba(139,92,246,0.3)]
                                  data-[state=active]:shadow-[0_10px_30px_rgba(139,92,246,0.4)]
                                  hover:shadow-[0_20px_50px_rgba(139,92,246,0.6)]
                                  data-[state=active]:hover:brightness-110
                                  hover:-translate-y-0.5
                                  transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]
                                  relative overflow-hidden
                                  before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full
                                  before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)]
                                  before:transition-[left] before:duration-500
                                  hover:before:left-full
                                  text-white border border-transparent
                                  hover:bg-brand-500/10 hover:backdrop-blur
                                `
                              }
                            `}
                          >
                            Season {season.season_number}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      {seasonsData.map((season) => (
                        <TabsContent
                          key={season.season_number}
                          value={`season-${season.season_number}`}
                          className="mt-4"
                        >
                          <div className="space-y-1">
                            {season.episodes.map((episode) => (
                              <div
                                key={episode.id}
                                className="border border-white flex items-center space-x-3 bg-black  rounded-lg p-3 hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300 group h-12"
                              >
                                <div
                                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white will-change-transform transform-gpu ${
                                    customBackground?.includes("kids")
                                      ? "bg-yellow-500 shadow-[2px_19px_31px_rgba(234,179,8,0.35)]"
                                      : "bg-brand-500 shadow-[2px_19px_31px_rgba(30,27,95,0.35)]"
                                  }`}
                                  style={
                                    !customBackground?.includes("kids")
                                      ? {
                                          backgroundImage: `
                                    radial-gradient(93% 87% at 87% 89%, rgba(0, 0, 0, 0.23) 0%, transparent 86.18%),
                                    radial-gradient(66% 87% at 26% 20%, rgba(255, 255, 255, 0.41) 0%, rgba(255, 255, 255, 0) 70%)
                                  `,
                                        }
                                      : {}
                                  }
                                >
                                  {episode.episode_number}
                                </div>
                                <div className="flex-1 min-w-0">
                                  {/*<h4 className="font-medium text-white truncate text-sm">*/}
                                  {/*  {episode.title}*/}
                                  {/*</h4>*/}
                                  <div className="flex items-center space-x-2">
                                    <p className="font-medium text-white truncate text-sm max-w-96">
                                      {episode.description ||
                                        `Episode ${episode.episode_number} of ${series.title}`}
                                    </p>
                                    <span className="text-xs text-gray-500 whitespace-nowrap">
                                      {formatDuration(episode.duration_minutes)}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handlePlayEpisode(episode)}
                                  disabled={!episode.video_url}
                                  className={`p-2 rounded-full transition-colors ${episode.video_url ? "bg-white/10 hover:bg-white/20 text-white" : "bg-gray-600 text-gray-400 cursor-not-allowed"}`}
                                >
                                  <Play className="w-4 h-4 fill-current" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>
                )}

                {normalizedRecommendedContent.length > 0 && (
                  <HomeRow
                    title="More Like This"
                    items={normalizedRecommendedContent}
                    isMoreLikeThis
                    onOpenRelatedSeries={onOpenRelatedSeries}
                  />
                )}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      {/* Series Player */}
      {isSeriesPlayerOpen && currentPlayingEpisode && (
        <SeriesPlayer
          isOpen={isSeriesPlayerOpen}
          onClose={handleCloseSeriesPlayer}
          seriesTitle={series.title}
          seasons={seasonsData}
          currentEpisode={currentPlayingEpisode}
          currentSeason={currentPlayingSeason}
        />
      )}
    </>
  );
};

export default SeriesModal;
