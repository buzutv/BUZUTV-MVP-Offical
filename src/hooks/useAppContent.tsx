import { useMemo } from "react";
import { useContent } from "@/hooks/useContent";
import { useChannels } from "@/hooks/useChannels";
import { genres } from "@/data/mockMovies";

// Transform database content to match Movie interface
const transformDatabaseContent = (dbContent: any[]) => {
  console.log("🔄 [useAppContent] Transforming database content:", {
    inputCount: dbContent.length,
    inputTypes: dbContent.reduce(
      (acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
    inputGenres: [
      ...new Set(dbContent.map((item) => item.genre).filter(Boolean)),
    ],
    sampleInput: dbContent.slice(0, 2).map((item) => ({
      id: item.id,
      is_kids: item.is_kids,
      title: item.title,
      type: item.type,
      genre: item.genre,
      is_featured: item.is_featured,
      is_trending: item.is_trending,
      channel_id: item.channel_id,
    })),
  });

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
    duration: item.duration_minutes || 120,
    seasons: item.seasons,
    episodes: item.episodes,
    isFeatured: item.is_featured || false,
    isTrending: item.is_trending || false,
    channelId: item.channel_id,
    created_at: item.created_at,
    seasons_data: item.seasons_data,
  }));

  console.log("✅ [useAppContent] Content transformation complete:", {
    outputCount: transformed.length,
    outputTypes: transformed.reduce(
      (acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
    outputGenres: [...new Set(transformed.map((item) => item.genre))],
    featuredCount: transformed.filter((item) => item.isFeatured).length,
    trendingCount: transformed.filter((item) => item.isTrending).length,
    sampleOutput: transformed.slice(0, 2).map((item) => ({
      id: item.id,
      title: item.title,
      isKids: item.isKids,
      type: item.type,
      genre: item.genre,
      isFeatured: item.isFeatured,
      isTrending: item.isTrending,
    })),
  });

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
  const { content: dbContent, isLoading: dbContentLoading } = useContent();
  const { channels: dbChannels, isLoading: dbChannelsLoading } = useChannels();

  // Transform data when available
  const transformedContent = useMemo(() => {
    if (dbContentLoading || !dbContent.length) return [];
    return transformDatabaseContent(dbContent);
  }, [dbContent, dbContentLoading]);

  const transformedChannels = useMemo(() => {
    if (dbChannelsLoading || !dbChannels.length) return [];
    return transformDatabaseChannels(dbChannels);
  }, [dbChannels, dbChannelsLoading]);

  // Pre-compute all categories and filters
  const content = useMemo(() => {
    console.log("📂 [useAppContent] Starting content categorization:", {
      totalContent: transformedContent.length,
      availableTypes: [...new Set(transformedContent.map((item) => item.type))],
      availableGenres: [
        ...new Set(transformedContent.map((item) => item.genre)),
      ],
      predefinedGenres: genres,
    });

    const movies = transformedContent.filter((item) => item.type === "movie" && !item.isKids);
    const series = transformedContent.filter((item) => item.type === "series" && !item.isKids);
    const kids = transformedContent.filter((item) => item.isKids === true);

    console.log("📊 [useAppContent] Content type breakdown:", {
      movies: movies.length,
      series: series.length,
      kids: kids.length,
      total: movies.length + series.length + kids.length,
      movieTitles: movies.slice(0, 3).map((m) => m.title),
      seriesTitles: series.slice(0, 3).map((s) => s.title),
      kidsTitles: kids.slice(0, 3).map((k) => k.title),
    });

    return {
      movies: {
        all: movies,
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
            if (genreMovies.length > 0) {
              console.log(`🎬 [useAppContent] Movies in ${genre}:`, {
                count: genreMovies.length,
                titles: genreMovies.slice(0, 3).map((m) => m.title),
              });
            }
            return acc;
          },
          {} as Record<string, typeof movies>,
        ),
      },
      series: {
        all: series,
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
            if (genreSeries.length > 0) {
              console.log(`📺 [useAppContent] Series in ${genre}:`, {
                count: genreSeries.length,
                titles: genreSeries.slice(0, 3).map((s) => s.title),
              });
            }
            return acc;
          },
          {} as Record<string, typeof series>,
        ),
      },
      kids: {
        all: kids,
        movies: kids.filter((item) => item.type === "movie"),
        series: kids.filter((item) => item.type === "series"),
        featured: kids.filter((item) => item.isFeatured),
        trending: kids.filter((item) => item.isTrending),
        new: kids.slice(0, 8),
        byGenre: genres.reduce(
          (acc, genre) => {
            const genreKids = kids.filter((item) => item.genre === genre);
            acc[genre] = genreKids;
            if (genreKids.length > 0) {
              console.log(`🧸 [useAppContent] Kids content in ${genre}:`, {
                count: genreKids.length,
                titles: genreKids.slice(0, 3).map((k) => k.title),
              });
            }
            return acc;
          },
          {} as Record<string, typeof kids>,
        ),
      },
      home: {
        trending: transformedContent.filter((item) => item.isTrending && !item.isKids),
        action: transformedContent.filter((item) => item.genre === "Action" && !item.isKids),
        drama: transformedContent.filter((item) => item.genre === "Drama" && !item.isKids),
        romance: transformedContent.filter((item) => item.genre === "Romance" && !item.isKids),
        comedy: transformedContent.filter((item) => item.genre === "Comedy" && !item.isKids),
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

  // Log final content structure
  console.log("🎯 [useAppContent] Final content structure:", {
    totalMovies: content.movies.all.length,
    totalSeries: content.series.all.length,
    totalKids: content.kids.all.length,
    featuredMovies: content.movies.featured.length,
    featuredSeries: content.series.featured.length,
    trendingMovies: content.movies.trending.length,
    trendingSeries: content.series.trending.length,
    homeCategories: {
      trending: content.home.trending.length,
      action: content.home.action.length,
      drama: content.home.drama.length,
      romance: content.home.romance.length,
      comedy: content.home.comedy.length,
      documentary: content.home.documentary.length,
      informational: content.home.informational.length,
    },
    genreDistribution: Object.entries(content.movies.byGenre).map(
      ([genre, movies]) => ({
        genre,
        movieCount: movies.length,
        seriesCount: content.series.byGenre[genre]?.length || 0,
      }),
    ),
  });

  return {
    // Legacy support - return all movies for components that still need it
    movies: transformedContent,
    channels: transformedChannels,
    isLoading: dbContentLoading || dbChannelsLoading,
    // New optimized data structure
    content,
    // Quick access to specific categories
    movieContent: content.movies,
    seriesContent: content.series,
    kidsContent: content.kids,
    homeContent: content.home,
  };
};
