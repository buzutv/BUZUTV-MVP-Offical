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
        const history = Array.isArray(item.user_watch_history)
          ? item.user_watch_history[0]
          : item.user_watch_history;
        return history && history.watch_percentage > 0 && history.watch_percentage < 100;
      }).sort((a, b) => {
        const historyA = Array.isArray(a.user_watch_history) ? a.user_watch_history[0] : a.user_watch_history;
        const historyB = Array.isArray(b.user_watch_history) ? b.user_watch_history[0] : b.user_watch_history;
        return new Date(historyB?.watched_at || 0).getTime() - new Date(historyA?.watched_at || 0).getTime();
      });

    return {
      movies: {
        all: movies,
        continueWatching: filterContinueWatching(movies),
        kids: movies.filter((movie) => movie.isKids === true),
        featured: movies.filter((movie) => movie.isFeatured),
        trending: movies.filter((movie) => movie.isTrending),
        topRanked: [...movies].sort((a, b) => b.rating - a.rating).slice(0, 5),
        recommended: movies.slice(0, 6),
        new: movies.slice(2, 8),
        byGenre: genres.reduce(
          (acc, genre) => {
            const genreMovies = movies.filter((movie) => movie.genre === genre);
            acc[genre] = genreMovies;
            return acc;
          },
          {} as Record<string, typeof movies>,
        ),
      },
      series: {
        all: series,
        continueWatching: filterContinueWatching(series),
        kids: series.filter((show) => show.isKids === true),
        featured: series.filter((show) => show.isFeatured),
        trending: series.filter((show) => show.isTrending),
        topRanked: [...series].sort((a, b) => b.rating - a.rating).slice(0, 5),
        recommended: series.slice(0, 6),
        new: series.slice(2, 8),
        byGenre: genres.reduce(
          (acc, genre) => {
            const genreSeries = series.filter((show) => show.genre === genre);
            acc[genre] = genreSeries;
            return acc;
          },
          {} as Record<string, typeof series>,
        ),
      },
      kids: {
        all: kids,
        continueWatching: filterContinueWatching(kids),
        movies: kids.filter((item) => item.type === "movie"),
        series: kids.filter((item) => item.type === "series"),
        featured: kids.filter((item) => item.isFeatured),
        trending: kids.filter((item) => item.isTrending),
        new: kids.slice(0, 8),
        byGenre: genres.reduce(
          (acc, genre) => {
            const genreKids = kids.filter((item) => item.genre === genre);
            acc[genre] = genreKids;
            return acc;
          },
          {} as Record<string, typeof kids>,
        ),
      },
      home: {
        trending: transformedContent.filter(
          (item) => item.isTrending && !item.isKids,
        ),
        action: transformedContent.filter(
          (item) => item.genre === "Action" && !item.isKids,
        ),
        drama: transformedContent.filter(
          (item) => item.genre === "Drama" && !item.isKids,
        ),
        romance: transformedContent.filter(
          (item) => item.genre === "Romance" && !item.isKids,
        ),
        comedy: transformedContent.filter(
          (item) => item.genre === "Comedy" && !item.isKids,
        ),
        documentary: transformedContent.filter(
          (item) => item.genre === "Documentary" && !item.isKids,
        ),
        informational: transformedContent.filter(
          (item) => item.genre === "Informational" && !item.isKids,
        ),
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
    refetch,
  };
};
