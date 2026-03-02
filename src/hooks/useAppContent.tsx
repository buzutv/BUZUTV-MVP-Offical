import { useMemo, useState, useEffect } from "react";
import { useContent } from "@/hooks/useContent";
import { useChannels } from "@/hooks/useChannels";
import { genres } from "@/data/mockMovies";
import { useAuth } from "@/contexts/AuthContext";
import { useGetUserWatchHistoryQuery } from "@/store/userWatchHistorySlice";
import { useGetSeasonWithEpisodesSeriesQuery, useLazyGetSeasonWithEpisodesQuery, useLazyGetSeasonWithEpisodesSeriesQuery } from "@/store/seasonSlice";
import { closeScreenPlayer } from "@/store/screenPlayerSlice";

// Transform database content to match Movie interface
const transformDatabaseContent = (dbContent: any[]) => {
  const transformed = dbContent.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description || "",
    isKids: item.is_kids || false,
    type: item.type,
    genre: item.genre || "Drama",
    year: item.year || new Date().getFullYear(),
    rating: item.rating || 0,
    posterUrl: item.poster_url || "/placeholder.svg",
    backdropUrl: item.backdrop_url || "/placeholder.svg",
    videoUrl: item.video_url || "",
    youtubeId: "", // Required for Movie type compatibility
    duration: item.duration_minutes || undefined,
    seasons: item.seasons,
    episodes: item.episodes,
    isFeatured: item.is_featured || false,
    isTrending: item.is_trending || false,
    channelId: item.channel_id,
    created_at: item.created_at,
    seasons_data: item.seasons_data,
    user_watch_history: item.user_watch_history,
  }));

  return transformed;
};

// Transform database channels to match Channel interface
const transformDatabaseChannels = (dbChannels: any[]) => {
  return dbChannels.map((channel) => ({
    id: channel.id,
    name: channel.name,
    description: channel.description || "",
    logoUrl: channel.logo_url || "/placeholder.svg",
    bannerUrl: channel.banner_url || "/placeholder.svg",
    isActive: channel.is_active !== false,
    contentCount: 0,
  }));
};

export const useAppContent = () => {
  const { user } = useAuth();
  const { content: dbContent, isLoading: dbContentLoading, refetch } = useContent();
  const { channels: dbChannels, isLoading: dbChannelsLoading } = useChannels();
  const { data: allHistory } = useGetUserWatchHistoryQuery(user?.id ?? "", { skip: !user?.id });
  const [triggerGetSeasons] = useLazyGetSeasonWithEpisodesQuery();
  const [seriesDetails, setSeriesDetails] = useState<Record<string, any>>({});
  const [fetchingIds, setFetchingIds] = useState<Set<string>>(new Set());
  const [triggerSeriesWithEpisodes] = useLazyGetSeasonWithEpisodesSeriesQuery();
  const {
    data: serieswithEpisodes
  } = useGetSeasonWithEpisodesSeriesQuery({ userId: user?.id ?? "" });

  console.log("serieswithEpisodes", serieswithEpisodes)

  const filterForSeriesContinueWatching = (): any[] => {
    if (!serieswithEpisodes) return [];

    return serieswithEpisodes.flatMap((season) =>
      season.episodes
        .filter((ep: any) => ep.watch_percentage > 0 && !ep.completed)
        .map((ep: any) => ({
          ...season.content,   // merge content fields
          ...ep,               // merge episode fields
          originalId: season.content.id, // Preserve series ID
          id: `${season.content.id}-ep-${ep.id}`, // Unique ID for key/grid
          season_number: season.season_number,
          season_title: season.title,
          type: 'series'
        }))
    );
  };


  const transformedContent = useMemo(() => {
    if (dbContentLoading || !dbContent?.length) {
      return [];
    }
    return transformDatabaseContent(dbContent);
  }, [dbContent, dbContentLoading]);

  const transformedChannels = useMemo(() => {
    if (dbChannelsLoading || !dbChannels?.length) {
      return []
    }
    return transformDatabaseChannels(dbChannels);
  }, [dbChannels, dbChannelsLoading]);

  const content = useMemo(() => {
    if (!transformedContent.length) {
      return {
        movies: {
          all: [],
          kids: [],
          featured: [],
          trending: [],
          topRanked: [],
          recommended: [],
          new: [],
          byGenre: {},
        },
        series: {
          all: [],
          kids: [],
          featured: [],
          trending: [],
          topRanked: [],
          recommended: [],
          new: [],
          byGenre: {},
        },
        kids: {
          all: [],
          movies: [],
          series: [],
          featured: [],
          trending: [],
          new: [],
          byGenre: {},
        },
        home: {
          trending: [],
          action: [],
          drama: [],
          romance: [],
          comedy: [],
          documentary: [],
          informational: [],
        },
        allContent: [],
      };
    }

    const movies = transformedContent.filter(
      (item) => item.type === "movie" && !item.isKids,
    );
    const series = transformedContent.filter(
      (item) => item.type === "series" && !item.isKids,
    );
    const kids = transformedContent.filter((item) => item.isKids === true);

    const filterContinueWatching = (items: any[]) =>

      items.flatMap(item => {
        // Enrich item with comprehensive history array
        let historyArr = Array.isArray(item.user_watch_history)
          ? [...item.user_watch_history]
          : (item.user_watch_history ? [item.user_watch_history] : []);

        if (allHistory) {
          const matchingHistory = allHistory.filter(h => h.movie_id === item.id);
          const combined = [...historyArr, ...matchingHistory];
          historyArr = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        }

        if (historyArr.length === 0) return [];

        // For series, use detailed structure if available
        if (item.type === "series") {
          console.log("Series Items", item)
          const detailedSeasons = seriesDetails[item.id];
          if (detailedSeasons) {
            const allEpisodes = detailedSeasons.flatMap((s: any) =>
              (s.episodes || []).map((ep: any) => ({
                ...ep,
                seasonNumber: s.season_number,
                actualSeasonData: s
              }))
            );

            // Find all episodes currently "In Progress" (started but not completed)
            const inProgress = allEpisodes.filter(
              (ep: any) => ((ep.watch_percentage || 0) > 0 || (ep.last_position || 0) > 0 || !!ep.watched_at) && !ep.completed
            );

            if (inProgress.length > 0) {
              // Return a separate entry for each in-progress episode
              return inProgress.map(ep => ({
                ...item,
                id: `${item.id}-ep-${ep.id}`, // Unique ID for the card
                originalId: item.id,
                episodeId: ep.id,
                seasonNumber: ep.seasonNumber,
                episodeNumber: ep.episode_number,
                episodeTitle: ep.title,
                user_watch_history: ep,
                isEpisodeCard: true
              }));
            }

            // If no episodes are in-progress, check if last completed has a next one
            const lastCompletedIdx = allEpisodes.reduce(
              (acc: number, ep: any, idx: number) => (ep.completed ? idx : acc),
              -1
            );
            if (lastCompletedIdx !== -1 && lastCompletedIdx < allEpisodes.length - 1) {
              const nextEp = allEpisodes[lastCompletedIdx + 1];
              return [{
                ...item,
                id: `${item.id}-next-${nextEp.id}`,
                originalId: item.id,
                episodeId: nextEp.id,
                seasonNumber: nextEp.seasonNumber,
                episodeNumber: nextEp.episode_number,
                episodeTitle: nextEp.title,
                user_watch_history: nextEp,
                isEpisodeCard: true
              }];
            }
          }

          // Fallback while loading detailed data: show based on latest history record
          const latestHistory = historyArr.sort((a, b) =>
            new Date(b.watched_at || 0).getTime() - new Date(a.watched_at || 0).getTime()
          )[0];

          if (latestHistory && !latestHistory.completed) {
            return [{
              ...item,
              user_watch_history: [latestHistory]
            }];
          }
          return [];
        }

        // For movies, show if started (has progress or history) but not completed
        const latestMovieHistory = historyArr.sort((a, b) =>
          new Date(b.watched_at || 0).getTime() - new Date(a.watched_at || 0).getTime()
        )[0];

        if (latestMovieHistory) {
          const isCompleted = latestMovieHistory.completed || (latestMovieHistory.watch_percentage || 0) >= 100;
          const hasStarted = (latestMovieHistory.last_position || 0) > 0 ||
            (latestMovieHistory.watch_percentage || 0) > 0 ||
            !!latestMovieHistory.watched_at;

          if (hasStarted && !isCompleted) {
            return [{
              ...item,
              user_watch_history: [latestMovieHistory]
            }];
          }
        }
        return [];
      }).sort((a, b) => {
        const getLatestTime = (it: any) => {
          const h = Array.isArray(it.user_watch_history) ? it.user_watch_history[0] : it.user_watch_history;
          return new Date(h?.watched_at || 0).getTime();
        };
        return getLatestTime(b) - getLatestTime(a);
      });

    const movieContinueWatching = filterContinueWatching(movies);
    const seriesContinueWatching = filterForSeriesContinueWatching();
    const kidsContinueWatching = filterContinueWatching(kids);

    const cwIds = new Set([
      ...movieContinueWatching.map(i => i.id),
      ...seriesContinueWatching.map(i => i.id),
      ...kidsContinueWatching.map(i => i.id)
    ]);

    // Helper to filter out items that are in Continue Watching
    const excludeCW = (items: any[]) => items.filter(item => !cwIds.has(item.id));

    return {
      movies: {
        all: movies,
        continueWatching: movieContinueWatching,
        kids: excludeCW(movies.filter((movie) => movie.isKids === true)),
        featured: excludeCW(movies.filter((movie) => movie.isFeatured)),
        trending: excludeCW(movies.filter((movie) => movie.isTrending)),
        topRanked: [...excludeCW(movies)].sort((a, b) => b.rating - a.rating).slice(0, 5),
        recommended: excludeCW(movies).slice(0, 6),
        new: excludeCW(movies).slice(2, 8),
        byGenre: genres.reduce(
          (acc, genre) => {
            const genreMovies = excludeCW(movies.filter((movie) => movie.genre === genre));
            acc[genre] = genreMovies;
            return acc;
          },
          {} as Record<string, typeof movies>,
        ),
      },
      series: {
        all: series,
        continueWatching: seriesContinueWatching,
        kids: excludeCW(series.filter((show) => show.isKids === true)),
        featured: excludeCW(series.filter((show) => show.isFeatured)),
        trending: excludeCW(series.filter((show) => show.isTrending)),
        topRanked: [...excludeCW(series)].sort((a, b) => b.rating - a.rating).slice(0, 5),
        recommended: excludeCW(series).slice(0, 6),
        new: excludeCW(series).slice(2, 8),
        byGenre: genres.reduce(
          (acc, genre) => {
            const genreSeries = excludeCW(series.filter((show) => show.genre === genre));
            acc[genre] = genreSeries;
            return acc;
          },
          {} as Record<string, typeof series>,
        ),
      },
      kids: {
        all: kids,
        continueWatching: kidsContinueWatching,
        movies: excludeCW(kids.filter((item) => item.type === "movie")),
        series: excludeCW(kids.filter((item) => item.type === "series")),
        featured: excludeCW(kids.filter((item) => item.isFeatured)),
        trending: excludeCW(kids.filter((item) => item.isTrending)),
        new: excludeCW(kids).slice(0, 8),
        byGenre: genres.reduce(
          (acc, genre) => {
            const genreKids = excludeCW(kids.filter((item) => item.genre === genre));
            acc[genre] = genreKids;
            return acc;
          },
          {} as Record<string, typeof kids>,
        ),
      },
      home: {
        trending: excludeCW(transformedContent.filter(
          (item) => item.isTrending && !item.isKids,
        )),
        action: excludeCW(transformedContent.filter(
          (item) => item.genre === "Action" && !item.isKids,
        )),
        drama: excludeCW(transformedContent.filter(
          (item) => item.genre === "Drama" && !item.isKids,
        )),
        romance: excludeCW(transformedContent.filter(
          (item) => item.genre === "Romance" && !item.isKids,
        )),
        comedy: excludeCW(transformedContent.filter(
          (item) => item.genre === "Comedy" && !item.isKids,
        )),
        documentary: excludeCW(transformedContent.filter(
          (item) => item.genre === "Documentary" && !item.isKids,
        )),
        informational: excludeCW(transformedContent.filter(
          (item) => item.genre === "Informational" && !item.isKids,
        )),
      },
      allContent: transformedContent,
    };
  }, [transformedContent, allHistory, seriesDetails]);

  // Effect to trigger fetching of series structure for identified candidates
  useEffect(() => {
    if (!user?.id || !allHistory) return;

    // Identify series IDs from history table
    const seriesWithHistory = new Set(
      allHistory
        .filter(h => h.episode_id) // Look at episode history records
        .map(h => h.movie_id) // movie_id contains the series ID for episodes
        .filter(Boolean) as string[]
    );

    // Also scan transformedContent for joined history (which might use movie_id)
    transformedContent.forEach(item => {
      if (item.type === 'series' && item.user_watch_history) {
        const historyArr = Array.isArray(item.user_watch_history)
          ? item.user_watch_history
          : [item.user_watch_history];
        if (historyArr.some((h: any) => h.episode_id || h.movie_id)) {
          seriesWithHistory.add(item.id);
        }
      }
    });

    seriesWithHistory.forEach(async (id) => {
      if (!seriesDetails[id] && !fetchingIds.has(id)) {
        setFetchingIds(prev => new Set(prev).add(id));
        try {
          const data = await triggerGetSeasons({ contentId: id, userId: user.id }).unwrap();
          setSeriesDetails(prev => ({ ...prev, [id]: data }));
        } catch (error) {
          console.error(`Failed to fetch seasons for series ${id}:`, error);
        } finally {
          setFetchingIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }
      }
    });
  }, [allHistory, user?.id, triggerGetSeasons, seriesDetails, fetchingIds, transformedContent]);



  return {
    movies: transformedContent,
    channels: transformedChannels,
    isLoading: dbContentLoading || dbChannelsLoading,
    content,
    movieContent: content.movies,
    seriesContent: content.series,
    kidsContent: content.kids,
    homeContent: content.home,
    continueWatching: [...(content.movies.continueWatching || []), ...(content.series.continueWatching || [])].sort((a, b) => {
      const getLatestTime = (it: any) => {
        const h = it.user_watch_history?.[0];
        return new Date(h?.watched_at || 0).getTime();
      };
      return getLatestTime(b) - getLatestTime(a);
    }),
    refetch,
  };
};
