import { useMemo } from "react";
import { useContent } from "@/hooks/useContent";
import { useChannels } from "@/hooks/useChannels";
import { genres } from "@/data/mockMovies";

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
  const { content: dbContent, isLoading: dbContentLoading, refetch } = useContent();
  const { channels: dbChannels, isLoading: dbChannelsLoading } = useChannels();


  const transformedContent = useMemo(() => {
    if (dbContentLoading || !dbContent?.length) {
      return [];
    }
    return transformDatabaseContent(dbContent);
  }, [dbContent, dbContentLoading]);

  const transformedChannels = useMemo(() => {
    if (dbChannelsLoading || !dbChannels?.length) {
      return [];
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
      items.filter((item) => {
        const historyArr = Array.isArray(item.user_watch_history)
          ? [...item.user_watch_history].sort((a, b) =>
            new Date(b.watched_at || 0).getTime() - new Date(a.watched_at || 0).getTime()
          )
          : (item.user_watch_history ? [item.user_watch_history] : []);

        const latestHistory = historyArr[0];
        if (!latestHistory) return false;

        // For series, show if ANY episode has a recorded last position > 0 or in-progress percentage
        if (item.type === "series") {
          return historyArr.some(h => (h.last_position || 0) > 0 || ((h.watch_percentage || 0) > 0 && (h.watch_percentage || 0) < 100));
        }

        // For movies, only show if started but not completed
        const isCompleted = latestHistory.completed || (latestHistory.watch_percentage || 0) >= 100;
        const hasProgress = (latestHistory.last_position || 0) > 0 || (latestHistory.watch_percentage || 0) > 0;

        return hasProgress && !isCompleted;
      }).sort((a, b) => {
        const getLatestTime = (it: any) => {
          const h = Array.isArray(it.user_watch_history)
            ? Math.max(...it.user_watch_history.map((r: any) => new Date(r.watched_at || 0).getTime()))
            : new Date(it.user_watch_history?.watched_at || 0).getTime();
          return h;
        };
        return getLatestTime(b) - getLatestTime(a);
      });

    const movieContinueWatching = filterContinueWatching(movies);
    const seriesContinueWatching = filterContinueWatching(series);
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
  }, [transformedContent]);



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
        const h = Array.isArray(it.user_watch_history)
          ? Math.max(...it.user_watch_history.map((r: any) => new Date(r.watched_at || 0).getTime()))
          : new Date(it.user_watch_history?.watched_at || 0).getTime();
        return h;
      };
      return getLatestTime(b) - getLatestTime(a);
    }),
    refetch,
  };
};
