import { useState } from "react";
import { Heart, Play, Star } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Movie } from "@/data/mockMovies";
import HomeRow from "@/components/HomeRow";
import BrandButton from "@/components/ui/BrandButton";
import SeriesPlayer from "@/components/SeriesPlayer";
import KidsMovieModal from "@/components/KidsMovieModal";
import FullscreenPlayer from "@/components/FullscreenPlayer";
import { useUserFavorites } from "@/hooks/useUserFavorites";
import { useContent } from "@/hooks/useContent";
import { useChannels } from "@/hooks/useChannels";

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

interface KidsSeriesModalProps {
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
}

const KidsSeriesModal = ({
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
}: KidsSeriesModalProps) => {
  const [isSeriesPlayerOpen, setIsSeriesPlayerOpen] = useState(false);
  const [currentPlayingEpisode, setCurrentPlayingEpisode] =
    useState<Episode | null>(null);
  const [currentPlayingSeason, setCurrentPlayingSeason] = useState<number>(1);
  const [nestedMovie, setNestedMovie] = useState<Movie | null>(null);
  const [isNestedFullscreen, setIsNestedFullscreen] = useState(false);
  const [nestedVideoUrl, setNestedVideoUrl] = useState<string>("");
  const [nestedVideoTitle, setNestedVideoTitle] = useState<string>("");
  const { favoriteIds, addToFavorites, removeFromFavorites } =
    useUserFavorites();
  const { content } = useContent();
  const { channels } = useChannels();

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

  // Filter recommended content for kids content only
  const filteredRecommendedContent = recommendedContent.filter((item) => {
    return item.id !== series.id && item.is_kids === true;
  });

  const normalizedRecommendedContent = filteredRecommendedContent.map(
    (item) => ({
      ...item,
      posterUrl: item.posterUrl || item.poster_url,
    }),
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[75vw] max-h-[90vh] text-white border-none p-0 overflow-hidden transition-all duration-700 ease-in-out opacity-0 scale-95 data-[state=open]:opacity-100 data-[state=open]:scale-100 bg-gradient-to-tl from-yellow-300 via-blue-300 to-sky-400">
          <DialogTitle className="sr-only">{series.title}</DialogTitle>
          <ScrollArea className="h-[90vh]">
            <div className="relative min-h-full bg-gradient-to-t from-black/50 via-transparent to-transparent">
              <div className="relative h-[60vh] overflow-hidden">
                <div className="absolute inset-0">
                  <img
                    src={series.posterUrl}
                    alt={series.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-blue-400 via-blue-400/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
                  <h1
                    className="text-5xl font-bold text-white mb-6 drop-shadow-lg text-shadow-lg"
                    style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8)" }}
                  >
                    {" "}
                    {series.title}
                  </h1>

                  <div className="flex items-center space-x-4 mb-4">
                    {showPlayButton && (
                      <BrandButton
                        onClick={handlePlayFirstEpisode}
                        variant="kids"
                        size="md"
                      >
                        <Play className="w-6 h-6 fill-current" />
                        <span>Play</span>
                      </BrandButton>
                    )}
                    <button
                      onClick={onSave}
                      className="bg-black/20 backdrop-blur-md text-white p-3 rounded-full transition-all duration-200 border border-blue-400/50 hover:border-blue-400 hover:bg-blue-500/60"
                    >
                      <Heart
                        className={`w-6 h-6 ${isSaved ? "fill-current text-red-500" : ""}`}
                      />
                    </button>
                    {seasonsData.length > 0 && (
                      <BrandButton
                        variant="kids"
                        size="sm"
                        className="pointer-events-none"
                      >
                        {seasonsData.length} Season
                        {seasonsData.length !== 1 ? "s" : ""}
                      </BrandButton>
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
                    <span className="border border-blue-400 px-2 py-0.5 text-xs text-white font-medium bg-blue-500/90">
                      KIDS
                    </span>
                    <span className="bg-yellow-500 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      {series.genre}
                    </span>{" "}
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

              <div className="p-8 pt-6 relative">
                <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-blue-400 to-transparent pointer-events-none" />
                {seasonsData.length > 0 && (
                  <div className="mb-8">
                    <Tabs defaultValue="season-1" className="w-full">
                      <TabsList className="grid w-full grid-cols-auto bg-transparent transition-all duration-300 group">
                        {seasonsData.map((season) => (
                          <TabsTrigger
                            key={season.season_number}
                            value={`season-${season.season_number}`}
                            className="transition-all duration-300 hover:scale-105 will-change-transform transform-gpu leading-5 hover:text-white data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-[2px_19px_31px_rgba(59,130,246,0.35)] data-[state=active]:hover:bg-blue-600 hover:bg-blue-500/20"
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
                                className="border border-blue-400/20 flex items-center space-x-3 bg-blue-500/60 rounded-lg p-3 hover:border-blue-400/40 hover:bg-blue-500/80 transition-all duration-300 group h-12"
                              >
                                <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white will-change-transform transform-gpu bg-yellow-500 shadow-[2px_19px_31px_rgba(234,179,8,0.35)]">
                                  {episode.episode_number}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <p className="font-medium text-white truncate text-sm max-w-96">
                                      {episode.description ||
                                        `Episode ${episode.episode_number} of ${series.title}`}
                                    </p>
                                    <span className="text-xs text-white whitespace-nowrap">
                                      {formatDuration(episode.duration_minutes)}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handlePlayEpisode(episode)}
                                  disabled={!episode.video_url}
                                  className={`p-2 rounded-full transition-colors ${episode.video_url ? "bg-blue-500/90 hover:bg-blue-500 text-white" : "bg-gray-600 text-gray-400 cursor-not-allowed"}`}
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
                    onItemClick={(movie) => {
                      setNestedMovie(movie); // Open nested kids modal
                    }}
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

      {/* Nested modals for "More Like This" items */}
      {nestedMovie &&
        (() => {
          const nestedIsSaved = favoriteIds.includes(nestedMovie.id);
          const nestedContentItem = content.find(
            (item) => item.id === nestedMovie.id,
          );
          const nestedVideoUrl = nestedContentItem?.video_url;
          const nestedChannel = channels.find(
            (ch) => ch.id === nestedMovie.channelId,
          );
          const nestedRecommendedContent = content
            .filter(
              (item) => item.id !== nestedMovie.id && item.is_kids === true,
            )
            .slice(0, 6);

          const handleNestedSave = () => {
            if (nestedIsSaved) {
              removeFromFavorites(nestedMovie.id);
            } else {
              addToFavorites(nestedMovie.id);
            }
          };

          const handleNestedPlay = () => {
            if (nestedVideoUrl) {
              // Close the nested modal and start fullscreen player
              setNestedMovie(null);
              setNestedVideoUrl(nestedVideoUrl);
              setNestedVideoTitle(nestedMovie.title);
              setIsNestedFullscreen(true);
            }
          };

          const handleNestedPlayEpisode = (
            url: string,
            episodeTitle: string,
          ) => {
            // Close the nested modal and start fullscreen player for episodes
            setNestedMovie(null);
            setNestedVideoUrl(url);
            setNestedVideoTitle(episodeTitle);
            setIsNestedFullscreen(true);
          };

          return nestedMovie.type === "series" ? (
            <KidsSeriesModal
              isOpen={!!nestedMovie}
              onClose={() => setNestedMovie(null)}
              series={nestedMovie}
              isSaved={nestedIsSaved}
              onSave={handleNestedSave}
              onPlayEpisode={handleNestedPlayEpisode}
              videoUrl={nestedVideoUrl}
              contentItem={nestedContentItem}
              channel={nestedChannel}
              recommendedContent={nestedRecommendedContent}
            />
          ) : (
            <KidsMovieModal
              isOpen={!!nestedMovie}
              onClose={() => setNestedMovie(null)}
              movie={nestedMovie}
              isSaved={nestedIsSaved}
              onSave={handleNestedSave}
              onPlay={handleNestedPlay}
              videoUrl={nestedVideoUrl}
              contentItem={nestedContentItem}
              channel={nestedChannel}
              recommendedContent={nestedRecommendedContent}
            />
          );
        })()}

      {/* Nested Fullscreen Player */}
      {isNestedFullscreen && nestedVideoUrl && (
        <FullscreenPlayer
          isOpen={isNestedFullscreen}
          onClose={() => {
            setIsNestedFullscreen(false);
            setNestedVideoUrl("");
            setNestedVideoTitle("");
          }}
          videoUrl={nestedVideoUrl}
          title={nestedVideoTitle}
        />
      )}
    </>
  );
};

export default KidsSeriesModal;
